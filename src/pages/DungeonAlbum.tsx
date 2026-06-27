// @ts-nocheck
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Lock, Key, Trash2, DollarSign, Edit, MoreVertical } from "lucide-react";
import { encryptMedia, decryptMedia, generateEncryptionKey, exportKey, importKey } from "@/lib/mediaEncryption";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import gargoyleLeft from "@/assets/gargoyle-left.png";
import gargoyleRight from "@/assets/gargoyle-right.png";

const DungeonAlbum = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState(null);
  const [album, setAlbum] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessKey, setAccessKey] = useState("");

  // Upload form state
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editChamberType, setEditChamberType] = useState("");
  const [editAccessType, setEditAccessType] = useState("");
  const [editPriceCents, setEditPriceCents] = useState(0);
  const [editAmbientColor, setEditAmbientColor] = useState("#8B0000");
  const [editTags, setEditTags] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId && albumId) {
      fetchAlbum();
      checkAccess();
    }
  }, [userId, albumId]);

  const checkUser = async () => {
    const { data:  { user } } = await supabase.auth.getUser();
    if (! user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const fetchAlbum = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dungeon_albums")
      .select("*")
      .eq("id", albumId)
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Album not found",
        variant: "destructive",
      });
      navigate("/my-dungeon");
    } else {
      setAlbum(data);
      // Populate edit form with current values
      setEditTitle(data.title || "");
      setEditDescription(data.description || "");
      setEditChamberType(data.chamber_type || "photo_album");
      setEditAccessType(data.access_type || "private");
      setEditPriceCents(data.price_cents || 0);
      setEditAmbientColor(data.ambient_color || "#8B0000");
      setEditTags(data.tags?. join(", ") || "");
      fetchMedia();
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
      const withUrls = await Promise.all((data || []).map(async (item) => {
        const isFull = /^https?:/i.test(item.media_url);
        if (isFull) return { ...item, signed_url: item.media_url };
        const { data: signed } = await supabase. storage
          .from("dungeon-media")
          .createSignedUrl(item.media_url, 60 * 60);
        return { ...item, signed_url: signed?. signedUrl || item.media_url };
      }));
      setMedia(withUrls);
    }
  };

  const checkAccess = async () => {
    if (!album) return;

    if (album.user_id === userId) {
      setAccessGranted(true);
      return;
    }

    if (album.chamber_type === "secret_chamber") {
      const { data } = await supabase
        . from("dungeon_access_keys")
        .select("*")
        .eq("album_id", albumId)
        .eq("user_id", userId)
        .eq("is_valid", true)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (data) {
        setAccessGranted(true);
      }
    } else {
      setAccessGranted(true);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (! files.length) return;

    const tooLarge = files.find(f => f.size > 500 * 1024 * 1024);
    if (tooLarge) {
      toast({
        title: "Error",
        description: "Each file must be under 500MB",
        variant:  "destructive",
      });
      return;
    }

    if (album?. chamber_type === "photo_album") {
      const invalidFile = files.find(f => ! f.type.startsWith("image/"));
      if (invalidFile) {
        toast({
          title: "Error",
          description: "Photo Albums only accept image files",
          variant: "destructive",
        });
        return;
      }
    } else if (album?.chamber_type === "video_archive") {
      const invalidFile = files.find(f => !f.type. startsWith("video/"));
      if (invalidFile) {
        toast({
          title: "Error",
          description: "Video Archives only accept video files",
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || ! userId || !albumId) return;

    setUploading(true);
    let success = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = file.name.split(". ").pop();
      const isSecretChamber = album?.chamber_type === "secret_chamber";

      try {
        let filePath;
        let encryptedUrl = null;
        let encryptionInfo = null;

        if (isSecretChamber) {
          const encryptionKey = await generateEncryptionKey();
          const { encryptedBlob, iv } = await encryptMedia(file, encryptionKey);
          
          filePath = `secret/${userId}/${albumId}/${Date.now()}-${i}.encrypted. ${fileExt}`;

          const { error: uploadError } = await supabase. storage
            .from("dungeon-media")
            .upload(filePath, encryptedBlob);

          if (uploadError) throw uploadError;

          const keyString = await exportKey(encryptionKey);
          const ivString = btoa(String.fromCharCode(...iv));
          encryptionInfo = `${keyString}:${ivString}`;
          encryptedUrl = filePath;
        } else {
          filePath = `${userId}/${albumId}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("dungeon-media")
            .upload(filePath, file);

          if (uploadError) throw uploadError;
        }

        const { error:  dbError } = await supabase. from("dungeon_media").insert({
          album_id: albumId,
          user_id:  userId,
          media_url:  isSecretChamber ? encryptionInfo : filePath,
          encrypted_url:  encryptedUrl,
          media_type: file.type,
          caption,
          is_secret_chamber:  isSecretChamber,
        });

        if (!dbError) success++;
      } catch (error) {
        toast({ title: "Upload failed", description: `${file.name}:  ${error.message}`, variant: "destructive" });
      }
    }

    toast({ title: "Upload complete", description: `${success}/${selectedFiles.length} files uploaded. ` });
    setUploadDialogOpen(false);
    setCaption("");
    setSelectedFiles([]);
    await fetchMedia();
    setUploading(false);
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm("Delete this media?")) return;

    const { error } = await supabase
      .from("dungeon_media")
      .delete()
      .eq("id", mediaId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description:  "Media deleted",
      });
      fetchMedia();
    }
  };

  const handleUpdateAlbum = async () => {
    if (!editTitle. trim()) {
      toast({
        title:  "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);

    try {
      const tagsArray = editTags
        .split(",")
        .map(t => t.trim())
        .filter(t => t. length > 0);

      const { error } = await supabase
        .from("dungeon_albums")
        .update({
          title: editTitle,
          description: editDescription,
          chamber_type: editChamberType,
          access_type: editAccessType,
          price_cents: editPriceCents,
          ambient_color: editAmbientColor,
          tags: tagsArray,
        })
        .eq("id", albumId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album updated successfully",
      });

      setEditDialogOpen(false);
      await fetchAlbum();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update album",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!confirm("⚠️ DELETE THIS ENTIRE ALBUM AND ALL ITS MEDIA?\n\nThis action CANNOT be undone! ")) return;

    try {
      // Delete all media from storage
      for (const item of media) {
        if (item.media_url && ! item.media_url.startsWith("http")) {
          await supabase.storage. from("dungeon-media").remove([item.media_url]);
        }
        if (item.encrypted_url) {
          await supabase.storage.from("dungeon-media").remove([item.encrypted_url]);
        }
      }

      // Delete album (cascade will delete media records)
      const { error } = await supabase
        .from("dungeon_albums")
        .delete()
        .eq("id", albumId);

      if (error) throw error;

      toast({
        title: "Album Deleted",
        description: "Album and all its media have been deleted",
      });

      navigate("/my-dungeon");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete album",
        variant: "destructive",
      });
    }
  };

  const handleAccessKeySubmit = async () => {
    if (!accessKey || !userId) return;

    const { data, error } = await supabase
      .from("dungeon_access_keys")
      .select("*")
      .eq("key_code", accessKey)
      .eq("album_id", albumId)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      toast({
        title: "Invalid Key",
        description: "Access key is invalid or expired",
        variant:  "destructive",
      });
    } else {
      setAccessGranted(true);
      toast({
        title: "Access Granted",
        description: "You now have access to this chamber",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!album) {
    return null;
  }

  const isOwner = album.user_id === userId;

  // Access gate for Secret Chamber
  if (album.chamber_type === "secret_chamber" && !accessGranted && !isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8 relative border-2 border-primary">
          <div className="absolute -top-16 left-8 w-32 h-32">
            <img src={gargoyleLeft} alt="Gargoyle Guardian" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -top-16 right-8 w-32 h-32">
            <img src={gargoyleRight} alt="Gargoyle Guardian" className="w-full h-full object-contain" />
          </div>

          <div className="text-center mt-12">
            <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Gargoyle Gate</h1>
            <p className="text-muted-foreground mb-6">
              This Secret Chamber is protected.  Enter your access key to proceed.
            </p>

            {album.access_type === "paid" && (
              <div className="mb-6 p-4 bg-primary/10 rounded">
                <p className="font-bold mb-2">Paid Access Required</p>
                <p className="text-2xl text-primary mb-4">${(album.price_cents / 100).toFixed(2)}</p>
                <Button className="w-full gap-2" variant="default">
                  <DollarSign className="w-4 h-4" />
                  Purchase Access
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Access Key</Label>
                <Input
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter your magic key"
                  className="text-center"
                />
              </div>
              <Button onClick={handleAccessKeySubmit} className="w-full gap-2">
                <Key className="w-4 h-4" />
                Enter Chamber
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/my-dungeon")}
                className="w-full"
              >
                Return to Dungeon
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/my-dungeon")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dungeon
          </Button>

          <div className="flex gap-2">
            {isOwner && (
              <>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Media</DialogTitle>
                      <DialogDescription>
                        {album.chamber_type === "photo_album" && "Upload images to your Photo Album (max 500MB each)."}
                        {album.chamber_type === "video_archive" && "Upload videos to your Video Archive (max 500MB each)."}
                        {album.chamber_type === "secret_chamber" && "Upload images or videos to your Secret Chamber (max 500MB each)."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Files (max 500MB each)</Label>
                        <Input 
                          type="file" 
                          multiple 
                          onChange={handleFileSelect} 
                          accept={
                            album.chamber_type === "photo_album" ? "image/*" : 
                            album.chamber_type === "video_archive" ? "video/*" :
                            "image/*,video/*"
                          }
                        />
                        {selectedFiles.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{selectedFiles.length} file(s) selected</p>
                        )}
                      </div>
                      <div>
                        <Label>Caption</Label>
                        <Textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Enter caption..."
                        />
                      </div>
                      <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading} className="w-full">
                        {uploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Album
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteAlbum} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Album
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Edit Album Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Album</DialogTitle>
                      <DialogDescription>Update your album settings</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target. value)}
                          placeholder="Album title"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Album description"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Chamber Type</Label>
                        <Select value={editChamberType} onValueChange={setEditChamberType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photo_album">📸 Photo Album</SelectItem>
                            <SelectItem value="video_archive">🎬 Video Archive</SelectItem>
                            <SelectItem value="secret_chamber">🔒 Secret Chamber</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editChamberType === "secret_chamber" && (
                        <>
                          <div>
                            <Label>Access Type</Label>
                            <Select value={editAccessType} onValueChange={setEditAccessType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">🔐 Private (Key Required)</SelectItem>
                                <SelectItem value="paid">💰 Paid Access</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {editAccessType === "paid" && (
                            <div>
                              <Label>Price (USD)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={(editPriceCents / 100).toFixed(2)}
                                onChange={(e) => setEditPriceCents(Math.round(parseFloat(e.target. value || "0") * 100))}
                                placeholder="0.00"
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <Label>Ambient Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editAmbientColor}
                            onChange={(e) => setEditAmbientColor(e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={editAmbientColor}
                            onChange={(e) => setEditAmbientColor(e. target.value)}
                            placeholder="#8B0000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Tags (comma-separated)</Label>
                        <Input
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="gothic, dark, photography"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateAlbum}
                          disabled={updating}
                          className="flex-1"
                        >
                          {updating ? "Updating..." : "Update Album"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <div
          className="rounded-lg p-6 mb-6"
          style={{
            background: `linear-gradient(135deg, ${album.ambient_color}22, ${album.ambient_color}05)`,
          }}
        >
          <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
          {album.description && (
            <p className="text-muted-foreground">{album.description}</p>
          )}
          {album.tags && album.tags. length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {album.tags. map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {media.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No media uploaded yet</div>
            {isOwner && (
              <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Add Media
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden group relative">
                {item.media_type. startsWith("image/") ? (
                  <img
                    src={item.signed_url || item.media_url}
                    alt={item.caption}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <video
                    src={item.signed_url || item.media_url}
                    className="w-full h-64 object-cover bg-black"
                    controls
                    autoPlay={album.chamber_type === "video_archive"}
                    loop={album.chamber_type === "video_archive"}
                    muted={album.chamber_type === "video_archive"}
                    playsInline
                  />
                )}
                {item.caption && (
                  <div className="p-3">
                    <p className="text-sm">{item.caption}</p>
                  </div>
                )}
                {isOwner && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteMedia(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DungeonAlbum;