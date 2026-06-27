// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Video, Lock, Plus, ArrowLeft, Skull, Flame, Eye, Crown, Edit, Trash2, Upload, X } from "lucide-react";
import redGargoyle from "@/assets/red-gargoyle.png";
import { cn } from "@/lib/utils";

const MyDungeon = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("photo_album");
  const [editingAlbum, setEditingAlbum] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("private");
  const [accessType, setAccessType] = useState("free");
  const [priceCents, setPriceCents] = useState(0);
  const [ambientColor, setAmbientColor] = useState("#8B0000");
  const [sigilOverlay, setSigilOverlay] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAlbums();
    }
  }, [userId, activeTab]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const fetchAlbums = async () => {
    if (! userId) return;

    setLoading(true);
    
    try {
      // Fetch albums
      const { data: albumsData, error: albumsError } = await supabase
        . from("dungeon_albums")
        .select("*")
        .eq("user_id", userId)
        .eq("chamber_type", activeTab)
        .order("created_at", { ascending: false });

      if (albumsError) throw albumsError;

      // Fetch detailed counts for all albums in parallel
      const albumsWithCounts = await Promise. all(
        (albumsData || []).map(async (album) => {
          // Get total count
          const { count: totalCount } = await supabase
            .from("dungeon_media")
            .select("*", { count: "exact", head:  true })
            .eq("album_id", album.id);

          // Get image count
          const { count: imageCount } = await supabase
            .from("dungeon_media")
            .select("*", { count: "exact", head: true })
            .eq("album_id", album.id)
            .like("media_type", "image%");

          // Get video count
          const { count: videoCount } = await supabase
            .from("dungeon_media")
            .select("*", { count: "exact", head: true })
            .eq("album_id", album.id)
            .like("media_type", "video%");

          return {
            ... album,
            media_count:  totalCount || 0,
            image_count: imageCount || 0,
            video_count:  videoCount || 0
          };
        })
      );

      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error("Fetch albums error:", error);
      toast({
        title:  "Error",
        description: "Failed to fetch albums",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (! file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Cover image must be under 10MB",
        variant:  "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Cover must be an image file",
        variant: "destructive",
      });
      return;
    }

    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const uploadCoverImage = async (albumId) => {
    if (!coverImage || !userId) return null;

    try {
      const fileExt = coverImage.name. split(".").pop();
      const fileName = `${albumId}/cover-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error:  uploadError } = await supabase.storage
        .from("dungeon-media")
        .upload(filePath, coverImage, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("dungeon-media")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Cover upload error:", error);
      return null;
    }
  };

  const handleCreateAlbum = async () => {
    if (!userId || !title) {
      toast({
        title:  "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setUploadingCover(true);

    try {
      const { data: albumData, error:  albumError } = await supabase
        .from("dungeon_albums")
        .insert({
          user_id: userId,
          title,
          description,
          tags:  tags.split(",").map((t) => t.trim()).filter(Boolean),
          privacy_level: privacyLevel,
          chamber_type: activeTab,
          access_type: accessType,
          price_cents: accessType === "paid" ? Math.round(priceCents * 100) : 0,
          ambient_color: ambientColor,
          sigil_overlay: sigilOverlay,
        })
        .select()
        .single();

      if (albumError) throw albumError;

      if (coverImage && albumData) {
        const coverUrl = await uploadCoverImage(albumData.id);
        
        if (coverUrl) {
          await supabase
            . from("dungeon_albums")
            .update({ cover_image_url: coverUrl })
            .eq("id", albumData.id);
        }
      }

      toast({
        title: "Success",
        description: "Album created successfully",
      });
      setCreateDialogOpen(false);
      resetForm();
      fetchAlbums();
    } catch (error) {
      console.error("Create album error:", error);
      toast({
        title:  "Error",
        description: "Failed to create album",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleEditAlbum = async () => {
    if (!editingAlbum || !title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setUploadingCover(true);

    try {
      const updateData = {
        title,
        description,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        privacy_level: privacyLevel,
        access_type: accessType,
        price_cents: accessType === "paid" ? Math.round(priceCents * 100) : 0,
        ambient_color: ambientColor,
        sigil_overlay: sigilOverlay,
      };

      if (coverImage) {
        const coverUrl = await uploadCoverImage(editingAlbum.id);
        if (coverUrl) {
          updateData.cover_image_url = coverUrl;
        }
      }

      const { error } = await supabase
        . from("dungeon_albums")
        .update(updateData)
        .eq("id", editingAlbum.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album updated successfully",
      });
      setEditDialogOpen(false);
      setEditingAlbum(null);
      resetForm();
      fetchAlbums();
    } catch (error) {
      console.error("Update album error:", error);
      toast({
        title: "Error",
        description: "Failed to update album",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteAlbum = async (albumId, e) => {
    e.stopPropagation();
    
    if (!confirm("⚠️ DELETE THIS ALBUM AND ALL ITS MEDIA?\n\nThis action CANNOT be undone! ")) return;

    try {
      const { error } = await supabase
        .from("dungeon_albums")
        .delete()
        .eq("id", albumId);

      if (error) throw error;

      toast({
        title: "Album Deleted",
        description: "Album and all its media have been deleted",
      });

      fetchAlbums();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete album",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (album, e) => {
    e.stopPropagation();
    setEditingAlbum(album);
    setTitle(album. title);
    setDescription(album.description || "");
    setTags(album.tags?. join(", ") || "");
    setPrivacyLevel(album.privacy_level);
    setAccessType(album. access_type || "free");
    setPriceCents((album.price_cents || 0) / 100);
    setAmbientColor(album.ambient_color || "#8B0000");
    setSigilOverlay(album.sigil_overlay || "");
    setCoverImagePreview(album.cover_image_url || "");
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTags("");
    setPrivacyLevel("private");
    setAccessType("free");
    setPriceCents(0);
    setAmbientColor("#8B0000");
    setSigilOverlay("");
    setEditingAlbum(null);
    setCoverImage(null);
    setCoverImagePreview("");
  };

  const getChamberIcon = (type) => {
    switch (type) {
      case "photo_album":  return <ImagePlus className="w-5 h-5" />;
      case "video_archive": return <Video className="w-5 h-5" />;
      case "secret_chamber": return <Lock className="w-5 h-5" />;
      default: return <ImagePlus className="w-5 h-5" />;
    }
  };

  const getChamberTitle = (type) => {
    switch (type) {
      case "photo_album": return "Photo Albums";
      case "video_archive": return "Video Archives";
      case "secret_chamber": return "Secret Chamber";
      default: return "Albums";
    }
  };

  const getChamberDescription = (type) => {
    switch (type) {
      case "photo_album": return "Captured moments from the shadows";
      case "video_archive":  return "Moving pictures from the abyss";
      case "secret_chamber": return "Your most protected and sacred content";
      default: return "";
    }
  };

  const CoverImageUpload = () => (
    <div>
      <Label className="text-crimson font-bold uppercase text-xs">Cover Image (Optional)</Label>
      <div className="mt-2 space-y-3">
        {coverImagePreview ?  (
          <div className="relative">
            <img
              src={coverImagePreview}
              alt="Cover preview"
              className="w-full h-48 object-cover rounded border-2 border-crimson/30"
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setCoverImage(null);
                setCoverImagePreview("");
              }}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-crimson/30 rounded cursor-pointer hover:border-crimson/60 transition-colors bg-slate-900/50">
            <Upload className="w-12 h-12 text-crimson/50 mb-2" />
            <span className="text-sm text-gray-400">Click to upload cover image</span>
            <span className="text-xs text-gray-500 mt-1">Max 10MB • JPG, PNG, WEBP</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black pb-24">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-crimson/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-900/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      {/* Main Content - Mobile First with Desktop Sidebar Offset */}
      <div className="relative z-10 w-full px-4 py-6 md:pl-[280px] md:pr-6 lg:pl-[304px] lg:pr-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 md:mb-12">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="gap-2 border border-crimson/30 hover:border-crimson hover:bg-crimson/10 text-crimson w-full sm:w-auto"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Castle</span>
              </Button>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2 bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 border border-crimson/50 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Album</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border-crimson/30">
                  <DialogHeader>
                    <DialogTitle className="text-crimson text-xl md:text-2xl font-serif flex items-center gap-2">
                      <Skull className="h-5 w-5 md:h-6 md:w-6" />
                      Create New Album
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                      Craft a new chamber for your dark collection.  Set privacy, pricing, and ambient styling.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <CoverImageUpload />
                    
                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter album title..."
                        className="bg-slate-900 border-crimson/30 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your collection..."
                        className="bg-slate-900 border-crimson/30 text-white mt-2 resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Tags (comma-separated)</Label>
                      <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="ritual, dark, gothic, occult"
                        className="bg-slate-900 border-crimson/30 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Privacy Level</Label>
                        <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                          <SelectTrigger className="bg-slate-900 border-crimson/30 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-crimson/30">
                            <SelectItem value="private" className="text-white">
                              🔒 Private
                            </SelectItem>
                            <SelectItem value="public" className="text-white">
                              🌐 Public
                            </SelectItem>
                            <SelectItem value="coven_only" className="text-white">
                              👥 Coven Only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {activeTab === "secret_chamber" && (
                        <div>
                          <Label className="text-crimson font-bold uppercase text-xs">Access Type</Label>
                          <Select value={accessType} onValueChange={setAccessType}>
                            <SelectTrigger className="bg-slate-900 border-crimson/30 text-white mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-crimson/30">
                              <SelectItem value="free" className="text-white">
                                Free
                              </SelectItem>
                              <SelectItem value="paid" className="text-white">
                                💰 Paid
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {activeTab === "secret_chamber" && accessType === "paid" && (
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Price ($)</Label>
                        <Input
                          type="number"
                          value={priceCents}
                          onChange={(e) => setPriceCents(parseFloat(e.target.value) || 0)}
                          placeholder="9.99"
                          step="0.01"
                          className="bg-slate-900 border-crimson/30 text-white mt-2"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Ambient Color</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="color"
                          value={ambientColor}
                          onChange={(e) => setAmbientColor(e. target.value)}
                          className="w-16 h-10 md:w-20 md:h-12 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={ambientColor}
                          readOnly
                          className="bg-slate-900 border-crimson/30 text-white flex-1 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Sigil / Emoji Overlay (optional)</Label>
                      <Input
                        value={sigilOverlay}
                        onChange={(e) => setSigilOverlay(e.target.value)}
                        placeholder="🔥 ⛧ 🗡️ 💀"
                        className="bg-slate-900 border-crimson/30 text-white mt-2"
                        maxLength={2}
                      />
                    </div>

                    <Button
                      onClick={handleCreateAlbum}
                      disabled={uploadingCover}
                      className="w-full bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white font-bold uppercase tracking-wider text-sm md:text-base"
                    >
                      <Skull className="h-4 w-4 mr-2" />
                      {uploadingCover ? "Creating..." : "Create Album"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Album Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={(open) => {
                setEditDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border-crimson/30">
                  <DialogHeader>
                    <DialogTitle className="text-crimson text-xl md:text-2xl font-serif flex items-center gap-2">
                      <Edit className="h-5 w-5 md:h-6 md:w-6" />
                      Edit Album
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                      Update your album settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <CoverImageUpload />
                    
                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target. value)}
                        placeholder="Enter album title..."
                        className="bg-slate-900 border-crimson/30 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your collection..."
                        className="bg-slate-900 border-crimson/30 text-white mt-2 resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Tags (comma-separated)</Label>
                      <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="ritual, dark, gothic, occult"
                        className="bg-slate-900 border-crimson/30 text-white mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Privacy Level</Label>
                        <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                          <SelectTrigger className="bg-slate-900 border-crimson/30 text-white mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-crimson/30">
                            <SelectItem value="private" className="text-white">🔒 Private</SelectItem>
                            <SelectItem value="public" className="text-white">🌐 Public</SelectItem>
                            <SelectItem value="coven_only" className="text-white">👥 Coven Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editingAlbum?. chamber_type === "secret_chamber" && (
                        <div>
                          <Label className="text-crimson font-bold uppercase text-xs">Access Type</Label>
                          <Select value={accessType} onValueChange={setAccessType}>
                            <SelectTrigger className="bg-slate-900 border-crimson/30 text-white mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-crimson/30">
                              <SelectItem value="free" className="text-white">Free</SelectItem>
                              <SelectItem value="paid" className="text-white">💰 Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {editingAlbum?.chamber_type === "secret_chamber" && accessType === "paid" && (
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Price ($)</Label>
                        <Input
                          type="number"
                          value={priceCents}
                          onChange={(e) => setPriceCents(parseFloat(e.target.value) || 0)}
                          placeholder="9.99"
                          step="0.01"
                          className="bg-slate-900 border-crimson/30 text-white mt-2"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Ambient Color</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="color"
                          value={ambientColor}
                          onChange={(e) => setAmbientColor(e.target.value)}
                          className="w-16 h-10 md:w-20 md:h-12 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={ambientColor}
                          readOnly
                          className="bg-slate-900 border-crimson/30 text-white flex-1 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Sigil / Emoji Overlay (optional)</Label>
                      <Input
                        value={sigilOverlay}
                        onChange={(e) => setSigilOverlay(e.target.value)}
                        placeholder="🔥 ⛧ 🗡️ 💀"
                        className="bg-slate-900 border-crimson/30 text-white mt-2"
                        maxLength={2}
                      />
                    </div>

                    <Button
                      onClick={handleEditAlbum}
                      disabled={uploadingCover}
                      className="w-full bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white font-bold uppercase tracking-wider text-sm md:text-base"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {uploadingCover ? "Updating..." : "Update Album"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Title with animated effects - Mobile First */}
            <div className="relative text-center py-6 md:py-8">
              <div className="absolute inset-0 flex items-center justify-center opacity-5 md:opacity-10">
                <Skull className="w-32 h-32 md:w-64 md:h-64 text-crimson animate-pulse" style={{ animationDuration: "3s" }} />
              </div>
              <h1 className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-crimson via-red-500 to-crimson animate-gradient mb-3 md:mb-4">
                My Dungeon
              </h1>
              <div className="flex items-center justify-center gap-3 md:gap-4 text-gray-400">
                <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500 animate-pulse" />
                <p className="text-xs sm:text-sm md:text-base font-gothic italic">Your private collection of darkness</p>
                <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500 animate-pulse" />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-1. 5 md:gap-2 mb-6 md:mb-8 bg-slate-900/50 border border-crimson/20 p-1.5 md:p-2">
              <TabsTrigger
                value="photo_album"
                className={cn(
                  "gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base px-2 py-2. 5 md:px-3 md:py-3 transition-all duration-300",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-crimson data-[state=active]:to-purple-700",
                  "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-crimson/50",
                  "hover:bg-crimson/10 border border-transparent data-[state=active]:border-crimson/50"
                )}
              >
                <ImagePlus className="w-3. 5 h-3.5 md:w-5 md:h-5 shrink-0" />
                <span className="font-bold truncate">Photos</span>
              </TabsTrigger>
              <TabsTrigger
                value="video_archive"
                className={cn(
                  "gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base px-2 py-2.5 md:px-3 md:py-3 transition-all duration-300",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-crimson data-[state=active]:to-purple-700",
                  "data-[state=active]:text-white data-[state=active]: shadow-lg data-[state=active]:shadow-crimson/50",
                  "hover:bg-crimson/10 border border-transparent data-[state=active]:border-crimson/50"
                )}
              >
                <Video className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
                <span className="font-bold truncate">Videos</span>
              </TabsTrigger>
              <TabsTrigger
                value="secret_chamber"
                className={cn(
                  "gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base px-2 py-2.5 md:px-3 md: py-3 transition-all duration-300",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-crimson data-[state=active]:to-purple-700",
                  "data-[state=active]: text-white data-[state=active]:shadow-lg data-[state=active]:shadow-crimson/50",
                  "hover:bg-crimson/10 border border-transparent data-[state=active]:border-crimson/50"
                )}
              >
                <Lock className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
                <span className="font-bold truncate">Secret</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {/* Chamber Description Banner - Mobile First */}
              <div className="mb-4 md:mb-6 p-4 md:p-6 bg-gradient-to-r from-crimson/10 via-purple-900/10 to-crimson/10 border-2 border-crimson/30 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
                  {getChamberIcon(activeTab)}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-crimson">{getChamberTitle(activeTab)}</h2>
                </div>
                <p className="text-gray-400 italic text-sm md:text-base">{getChamberDescription(activeTab)}</p>
              </div>

              {activeTab === "secret_chamber" && (
                <div className="relative mb-6 md:mb-8 border-2 md:border-4 border-crimson rounded-lg overflow-hidden bg-gradient-to-b from-black via-slate-950 to-black shadow-2xl shadow-crimson/50">
                  <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-crimson/20 via-transparent to-transparent animate-pulse"
                    style={{ animationDuration: "4s" }}
                  />

                  <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-12 p-4 md:p-6 lg:p-8">
                    {/* Left Gargoyle - Mobile First */}
                    <div className="w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-40 lg:w-40 lg:h-48 shrink-0 animate-pulse" style={{ animationDuration: "3s" }}>
                      <img
                        src={redGargoyle}
                        alt="Infernal Guardian"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(220,20,60,0.9)] md:drop-shadow-[0_0_25px_rgba(220,20,60,1)] hover:scale-110 transition-transform duration-500 cursor-pointer"
                      />
                    </div>

                    {/* Center Content - Mobile First */}
                    <div className="flex-1 text-center py-2 md:py-4 px-3 md:px-4 max-w-2xl">
                      <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
                        <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500 animate-bounce" />
                        <h2 className="text-xl sm: text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-crimson drop-shadow-[0_0_10px_rgba(220,20,60,0.8)]">
                          Infernal Gate
                        </h2>
                        <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed mb-3 md:mb-4">
                        Beyond this gate lies your most <span className="text-crimson font-bold">sacred and secret content</span>. Protected by
                        demonic guardians and infernal seals. 
                      </p>
                      <div className="flex items-center justify-center gap-3 md:gap-4 text-xs md:text-sm text-crimson/80">
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Exclusive • Private • Protected</span>
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                    </div>

                    {/* Right Gargoyle - Mobile First */}
                    <div className="w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-40 lg:w-40 lg:h-48 shrink-0 animate-pulse" style={{ animationDuration: "3s", animationDelay: "1.5s" }}>
                      <img
                        src={redGargoyle}
                        alt="Infernal Guardian"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(220,20,60,0.9)] md:drop-shadow-[0_0_25px_rgba(220,20,60,1)] hover:scale-110 transition-transform duration-500 scale-x-[-1] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Animated border pulse */}
                  <div className="absolute inset-0 border-2 md:border-4 border-crimson/50 rounded-lg pointer-events-none animate-pulse" style={{ animationDuration: "2s" }} />

                  {/* Corner decorations - Hidden on mobile */}
                  <div className="hidden md:block absolute top-2 left-2 w-8 h-8 md:w-12 md:h-12 border-t-2 border-l-2 md:border-t-4 md:border-l-4 border-crimson/70 rounded-tl-lg" />
                  <div className="hidden md:block absolute top-2 right-2 w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 md:border-t-4 md:border-r-4 border-crimson/70 rounded-tr-lg" />
                  <div className="hidden md:block absolute bottom-2 left-2 w-8 h-8 md:w-12 md:h-12 border-b-2 border-l-2 md:border-b-4 md:border-l-4 border-crimson/70 rounded-bl-lg" />
                  <div className="hidden md:block absolute bottom-2 right-2 w-8 h-8 md:w-12 md:h-12 border-b-2 border-r-2 md:border-b-4 md:border-r-4 border-crimson/70 rounded-br-lg" />
                </div>
              )}

              {loading ?  (
                <div className="text-center py-16 md:py-20">
                  <div className="inline-flex flex-col items-center gap-4">
                    <Skull className="h-12 w-12 md:h-16 md:w-16 text-crimson animate-pulse" />
                    <div className="flex gap-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-crimson rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-crimson rounded-full animate-bounce" style={{ animationDelay:  "0.2s" }} />
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-crimson rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <p className="text-gray-400 font-gothic text-sm md:text-base">Summoning your collection...</p>
                  </div>
                </div>
              ) : albums.length === 0 ? (
                <div className="text-center py-16 md:py-20 px-4">
                  <div className="inline-flex flex-col items-center gap-6 max-w-md">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-crimson/20 to-purple-900/20 border-4 border-crimson/30 flex items-center justify-center">
                      {getChamberIcon(activeTab)}
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-crimson mb-2">Empty Chamber</h3>
                      <p className="text-gray-400 mb-6 text-sm md:text-base">
                        No {getChamberTitle(activeTab).toLowerCase()} exist yet. Create your first collection to begin. 
                      </p>
                    </div>
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      className="gap-2 bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white font-bold w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                      Create Your First Album
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                  {albums.map((album) => (
                    <Card
                      key={album.id}
                      className={cn(
                        "cursor-pointer hover:border-crimson transition-all duration-500 group overflow-hidden relative",
                        "bg-slate-900/50 border-2 border-crimson/20 hover:scale-105 hover:shadow-2xl"
                      )}
                      style={{
                        boxShadow: `0 0 20px ${album.ambient_color}30, 0 0 40px ${album.ambient_color}20`,
                      }}
                      onClick={() => navigate(`/dungeon/album/${album.id}`)}
                    >
                      <div
                        className="h-40 sm:h-44 md:h-48 lg:h-56 rounded-t-lg relative overflow-hidden"
                      >
                        {/* Cover Image or Gradient Background */}
                        {album.cover_image_url ? (
                          <img 
                            src={album.cover_image_url} 
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            style={{
                              background: `linear-gradient(135deg, ${album.ambient_color}66, ${album.ambient_color}22, #000000)`,
                            }} 
                            className="w-full h-full" 
                          />
                        )}
                        
                        {/* Animated overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {album.sigil_overlay && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-5xl md:text-6xl lg:text-7xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform transition-transform">
                              {album.sigil_overlay}
                            </div>
                          </div>
                        )}

                        {/* EDIT/DELETE BUTTONS - TOP RIGHT */}
                        <div className="absolute top-2 right-2 flex gap-1. 5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => openEditDialog(album, e)}
                            className="bg-slate-900/90 hover:bg-crimson/20 text-crimson border border-crimson/30 p-1.5 h-auto"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => handleDeleteAlbum(album.id, e)}
                            className="bg-red-600/90 hover:bg-red-700 p-1.5 h-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Paid badge */}
                        {album. access_type === "paid" && (
                          <div className="absolute top-2 left-2">
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              ${(album.price_cents / 100).toFixed(2)}
                            </div>
                          </div>
                        )}

                        {/* Privacy indicator - Bottom Left */}
                        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3">
                          <div
                            className={cn(
                              "px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold flex items-center gap-1",
                              album.privacy_level === "private" && "bg-purple-900/80 text-purple-200 border border-purple-500/50",
                              album.privacy_level === "public" && "bg-green-900/80 text-green-200 border border-green-500/50",
                              album.privacy_level === "coven_only" && "bg-blue-900/80 text-blue-200 border border-blue-500/50"
                            )}
                          >
                            {album.privacy_level === "private" && <Lock className="w-3 h-3" />}
                            {album.privacy_level === "public" && <Eye className="w-3 h-3" />}
                            {album.privacy_level === "coven_only" && <Crown className="w-3 h-3" />}
                            <span className="hidden sm:inline">{album.privacy_level. replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 md:p-4 lg:p-5 bg-gradient-to-b from-slate-900/80 to-slate-950">
                        <h3 className="font-bold text-base md:text-lg lg:text-xl mb-2 text-white group-hover:text-crimson transition-colors line-clamp-1">
                          {album.title}
                        </h3>
                        {album.description && (
                          <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3 line-clamp-2 leading-relaxed">{album.description}</p>
                        )}
                        {album.tags && album.tags. length > 0 && (
                          <div className="flex flex-wrap gap-1 md:gap-1.5 mb-2 md:mb-3">
                            {album.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-crimson/20 text-crimson px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-crimson/30 font-semibold"
                              >
                                #{tag}
                              </span>
                            ))}
                            {album.tags.length > 3 && (
                              <span className="text-xs bg-purple-900/20 text-purple-300 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full border border-purple-500/30 font-semibold">
                                +{album.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 md:pt-3 border-t border-crimson/20">
                          <div className="flex items-center gap-2 font-semibold">
                            {album.image_count > 0 && (
                              <span className="flex items-center gap-1 text-crimson">
                                <ImagePlus className="w-3 h-3" />
                                {album.image_count}
                              </span>
                            )}
                            {album.video_count > 0 && (
                              <span className="flex items-center gap-1 text-purple-400">
                                <Video className="w-3 h-3" />
                                {album.video_count}
                              </span>
                            )}
                            {album.media_count === 0 && <span className="text-gray-600">Empty</span>}
                          </div>
                          <span className="text-crimson/70 font-gothic hidden sm:inline">
                            {new Date(album.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        . animate-gradient {
          background-size: 200% 200%;
          animation:  gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default MyDungeon;