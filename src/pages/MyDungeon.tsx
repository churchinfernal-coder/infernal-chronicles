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
import { ImagePlus, Video, Lock, Plus, ArrowLeft } from "lucide-react";
import redGargoyle from "@/assets/red-gargoyle.png";

interface Album {
  id: string;
  title: string;
  description: string;
  tags: string[];
  privacy_level: string;
  chamber_type: string;
  access_type: string;
  price_cents: number;
  ambient_color: string;
  sigil_overlay: string;
  created_at: string;
  media_count?: number;
}

const MyDungeon = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("photo_album");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("private");
  const [accessType, setAccessType] = useState("free");
  const [priceCents, setPriceCents] = useState(0);
  const [ambientColor, setAmbientColor] = useState("#8B0000");
  const [sigilOverlay, setSigilOverlay] = useState("");

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
    if (! user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const fetchAlbums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dungeon_albums")
      .select("*")
      .eq("chamber_type", activeTab as any)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch albums",
        variant: "destructive",
      });
    } else {
      setAlbums(data || []);
    }
    setLoading(false);
  };

  const handleCreateAlbum = async () => {
    if (!userId || !title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await (supabase as any).from("dungeon_albums").insert({
  user_id: userId,
  title,
  description,
  tags: tags. split(",").map(t => t.trim()). filter(Boolean),
  privacy_level: privacyLevel,
  chamber_type: activeTab,
  access_type: accessType,
  price_cents: accessType === "paid" ? Math.round(priceCents * 100) : 0,
  ambient_color: ambientColor,
  sigil_overlay: sigilOverlay,
});

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create album",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Album created successfully",
      });
      setCreateDialogOpen(false);
      resetForm();
      fetchAlbums();
    }
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
  };

  const getChamberIcon = (type: string) => {
    switch (type) {
      case "photo_album":
        return <ImagePlus className="w-5 h-5" />;
      case "video_archive":
        return <Video className="w-5 h-5" />;
      case "secret_chamber":
        return <Lock className="w-5 h-5" />;
      default:
        return <ImagePlus className="w-5 h-5" />;
    }
  };

  const getChamberTitle = (type: string) => {
    switch (type) {
      case "photo_album":
        return "Photo Albums";
      case "video_archive":
        return "Video Archives";
      case "secret_chamber":
        return "Secret Chamber";
      default:
        return "Albums";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:ml-64 lg:ml-72">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2 shrink-0"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">My Dungeon</h1>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0" size="sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Album</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Album</DialogTitle>
                <DialogDescription>
                  Set up your new album with title, description, privacy settings, and ambient styling.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e. target.value)}
                    placeholder="Enter album title"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e. target.value)}
                    placeholder="Enter album description"
                  />
                </div>

                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target. value)}
                    placeholder="ritual, dark, gothic"
                  />
                </div>

                <div>
                  <Label>Privacy Level</Label>
                  <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="coven_only">Coven Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === "secret_chamber" && (
                  <>
                    <div>
                      <Label>Access Type</Label>
                      <Select value={accessType} onValueChange={setAccessType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free (Invite/Coven)</SelectItem>
                          <SelectItem value="paid">Paid Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {accessType === "paid" && (
                      <div>
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          value={priceCents}
                          onChange={(e) => setPriceCents(parseFloat(e.target.value) || 0)}
                          placeholder="9.99"
                          step="0.01"
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Label>Ambient Color</Label>
                  <Input
                    type="color"
                    value={ambientColor}
                    onChange={(e) => setAmbientColor(e.target.value)}
                  />
                </div>

                <Button onClick={handleCreateAlbum} className="w-full">
                  Create Album
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 mb-4 md:mb-6">
            <TabsTrigger value="photo_album" className="gap-1 md:gap-2 text-xs md:text-sm px-2 py-2">
              <ImagePlus className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="video_archive" className="gap-1 md:gap-2 text-xs md:text-sm px-2 py-2">
              <Video className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="secret_chamber" className="gap-1 md:gap-2 text-xs md:text-sm px-2 py-2">
              <Lock className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              <span className="truncate">Secret</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {activeTab === "secret_chamber" && (
              <div className="relative mb-6 md:mb-8 border-2 border-primary rounded-lg overflow-hidden bg-gradient-to-b from-black via-card/80 to-black">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 md:gap-8 p-4 md:p-6">
                  {/* Left Gargoyle */}
                  <div className="w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-40 flex-shrink-0 animate-pulse">
                    <img 
                      src={redGargoyle} 
                      alt="Infernal Guardian" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(220,20,60,0.8)] hover:scale-110 transition-transform duration-300" 
                    />
                  </div>

                  {/* Center Content */}
                  <div className="flex-1 text-center py-2 md:py-4 px-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-2 md:mb-3 drop-shadow-[0_0_10px_rgba(220,20,60,0.6)]">
                      🔥 Infernal Gate 🔥
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
                      Beyond this gate lies your most sacred and secret content. Protected by demonic guardians. 
                    </p>
                  </div>

                  {/* Right Gargoyle */}
                  <div className="w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-40 flex-shrink-0 animate-pulse" style={{ animationDelay: '0.5s' }}>
                    <img 
                      src={redGargoyle} 
                      alt="Infernal Guardian" 
                      className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(220,20,60,0.8)] hover:scale-110 transition-transform duration-300 scale-x-[-1]" 
                    />
                  </div>
                </div>
                
                <div className="absolute inset-0 border-2 border-primary/30 rounded-lg pointer-events-none animate-pulse" />
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                Loading... 
              </div>
            ) : albums.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-muted-foreground mb-4 text-sm md:text-base">
                  No {getChamberTitle(activeTab). toLowerCase()} yet
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" size="sm">
                  <Plus className="w-4 h-4" />
                  Create Your First Album
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {albums.map((album) => (
                  <Card
                    key={album.id}
                    className="cursor-pointer hover:border-primary transition-all duration-300 group overflow-hidden"
                    style={{
                      boxShadow: `0 0 20px ${album.ambient_color}33`,
                    }}
                    onClick={() => navigate(`/dungeon/album/${album.id}`)}
                  >
                    <div
                      className="h-36 sm:h-40 md:h-48 rounded-t-lg relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${album.ambient_color}44, ${album.ambient_color}11)`,
                      }}
                    >
                      {album.sigil_overlay && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <div className="text-4xl sm:text-5xl md:text-6xl">{album.sigil_overlay}</div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {album.access_type === "paid" && (
                          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                            ${(album.price_cents / 100).toFixed(2)}
                          </div>
                        )}
                        <div className="bg-background/80 backdrop-blur-sm p-1. 5 rounded">
                          {getChamberIcon(album.chamber_type)}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-base md:text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {album.title}
                      </h3>
                      {album.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                          {album. description}
                        </p>
                      )}
                      {album.tags && album.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {album.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{album.media_count || 0} items</span>
                        <span className="capitalize">{album.privacy_level. replace("_", " ")}</span>
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
  );
};

export default MyDungeon;
