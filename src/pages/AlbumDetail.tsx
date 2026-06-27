// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Trash2, Image as ImageIcon, Video, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const AlbumDetail = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (albumId) {
      fetchAlbum();
      fetchMedia();
    }
  }, [albumId]);

  const fetchAlbum = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dungeon_albums")
      .select("*")
      .eq("id", albumId)
      .single();

    if (error) {
      console.error("Fetch album error:", error);
      toast({
        title: "Error",
        description: "Failed to load album",
        variant: "destructive",
      });
      navigate("/my-dungeon");
    } else {
      setAlbum(data);
    }
    setLoading(false);
  };

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from("dungeon_media")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: false });

    if (! error && data) {
      setMedia(data);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes (max 500MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 500MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev. filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || ! albumId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user }, error:  userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;
      const failedUploads = [];

      for (const file of selectedFiles) {
        try {
          const fileExt = file.name.split(". ").pop().toLowerCase();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${albumId}/${fileName}`;

          console.log("Uploading to dungeon-media:", filePath, "Type:", file.type);

          // Upload to Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("dungeon-media")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            failedUploads.push(file.name);
            continue;
          }

          console.log("Upload successful:", uploadData);

          // Get public URL
          const { data:  urlData } = supabase. storage
            .from("dungeon-media")
            .getPublicUrl(filePath);

          console.log("Public URL:", urlData.publicUrl);

          // Determine media type based on file type and extension
          let mediaType = "image";
          if (
            file.type.startsWith("video/") ||
            ["mp4", "webm", "ogg", "mov", "avi", "mkv", "m4v", "3gp", "flv", "wmv"]. includes(fileExt)
          ) {
            mediaType = "video";
          }

          // Insert into database with user_id
          const { data:  insertData, error: dbError } = await supabase
            .from("dungeon_media")
            .insert({
              album_id: albumId,
              user_id: user.id,
              media_type: mediaType,
              media_url: urlData.publicUrl,
            })
            .select();

          if (dbError) {
            console.error("DB insert error:", dbError);
            // Try to clean up uploaded file
            await supabase.storage. from("dungeon-media").remove([filePath]);
            failedUploads.push(file. name);
            continue;
          }

          console.log("DB insert successful:", insertData);

          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          failedUploads.push(file.name);
        }
      }

      if (uploadedCount > 0) {
        toast({
          title: "Success",
          description: `${uploadedCount} of ${totalFiles} file(s) uploaded successfully`,
        });
      }

      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `Failed:  ${failedUploads.join(", ")}`,
          variant: "destructive",
        });
      }

      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadProgress(0);
      fetchMedia();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId, mediaUrl) => {
    if (! confirm("Delete this media?")) return;

    try {
      // Extract file path from URL
      const urlParts = mediaUrl.split("/dungeon-media/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("dungeon-media").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("dungeon_media")
        .delete()
        .eq("id", mediaId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Media deleted",
      });

      fetchMedia();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-crimson text-xl">Loading album...</p>
      </div>
    );
  }

  if (!album) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black pb-24">
      <div className="relative z-10 w-full px-4 py-6 md:pl-[280px] md:pr-6 lg:pl-[304px] lg:pr-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-dungeon")}
            className="gap-2 border border-crimson/30 hover: border-crimson hover:bg-crimson/10 text-crimson mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dungeon
          </Button>

          <div
            className="rounded-lg p-8 mb-8"
            style={{
              background: `linear-gradient(135deg, ${album.ambient_color}66, ${album.ambient_color}22, #000000)`,
            }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <h1 className="text-4xl font-bold text-white mb-4">{album.title}</h1>
                {album.description && (
                  <p className="text-gray-300 mb-4">{album.description}</p>
                )}
                {album.tags && album.tags. length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {album.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-crimson/20 text-crimson px-3 py-1 rounded-full border border-crimson/30"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-crimson to-purple-700 shrink-0">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-950 border-crimson/30 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-crimson text-2xl">Upload Media (Multiple Files)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-crimson mb-2 block">
                        Select Images & Videos (Multiple files supported)
                      </Label>
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,image/bmp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/avi,video/mov,video/m4v,video/3gp,video/flv,video/wmv"
                        multiple
                        onChange={handleFileSelect}
                        className="bg-slate-900 border-crimson/30 text-white"
                      />
                      <p className="text-gray-400 text-xs mt-2">
                        Supported:  JPG, PNG, GIF, WEBP, HEIC, BMP, SVG, MP4, WEBM, MOV, AVI, MKV, etc.  Max 500MB per file. 
                      </p>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-crimson">Selected Files ({selectedFiles.length})</Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedFiles([])}
                            className="text-crimson hover:bg-crimson/10 text-xs"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                          {selectedFiles.map((file, index) => {
                            const isVideo = file.type.startsWith("video/") || 
                              ["mp4", "webm", "ogg", "mov", "avi", "mkv", "m4v", "3gp", "flv", "wmv"]
                                .includes(file. name.split(".").pop().toLowerCase());
                            
                            return (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between bg-slate-900 p-3 rounded border border-crimson/20 hover:border-crimson/40 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {isVideo ?  (
                                    <Video className="w-5 h-5 text-purple-400 shrink-0" />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-crimson shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm truncate" title={file.name}>
                                      {file.name}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB • {isVideo ? "Video" : "Image"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFile(index)}
                                  className="text-crimson hover:bg-crimson/10 shrink-0 ml-2"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {uploading && (
                      <div className="space-y-2">
                        <Label className="text-crimson">
                          Uploading...  {uploadProgress.toFixed(0)}%
                        </Label>
                        <Progress value={uploadProgress} className="bg-slate-900" />
                        <p className="text-gray-400 text-xs">
                          Please wait, uploading {selectedFiles.length} file(s)...
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || uploading}
                      className="w-full bg-gradient-to-r from-crimson to-purple-700 hover:from-crimson/80 hover:to-purple-700/80"
                    >
                      {uploading 
                        ? `Uploading... (${uploadProgress.toFixed(0)}%)` 
                        : `Upload ${selectedFiles.length} File(s)`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {media.length === 0 ?  (
            <div className="text-center py-20 bg-slate-950/30 rounded-lg border border-crimson/20">
              <Upload className="w-16 h-16 text-crimson mx-auto mb-4" />
              <h2 className="text-2xl text-white mb-2">No media uploaded yet</h2>
              <p className="text-gray-400 mb-6">Upload photos or videos to this album</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden border-2 border-crimson/20 hover:border-crimson transition-all bg-slate-950"
                >
                  {item.media_type === "image" ? (
                    <img
                      src={item.media_url}
                      alt="Album media"
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={item.media_url}
                      className="w-full h-64 object-cover"
                      controls
                      preload="metadata"
                    />
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id, item.media_url)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-2">
                    {item.media_type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-white" />
                    ) : (
                      <Video className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {item.created_at && (
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1">
                      <p className="text-white text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetail;