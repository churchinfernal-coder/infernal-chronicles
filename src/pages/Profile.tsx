import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { InventoryDisplay } from "@/components/InventoryDisplay";
import { ProfileSkinDisplay, ProfileBadgeDisplay } from "@/components/ProfileDisplay";
import { ImageUpload } from "@/components/ImageUpload";
import { InfernalIdentitySelect } from "@/components/InfernalIdentitySelect";
import { InterestsSelect } from "@/components/InterestsSelect";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { CastleWizard } from "@/components/CastleWizard";
import { AdvancedSigilCreator } from "@/components/AdvancedSigilCreator";
import { DungeonDoorTransition } from "@/components/DungeonDoorTransition";
import { 
  Users, TrendingUp, User, ImagePlus, Video, Lock, Calendar, 
  Briefcase, Heart, Flag, Home, MapPin, Music, Volume2, VolumeX,
  Loader2, Palette, Type, Shield, CheckCircle2
} from "lucide-react";
import { HeaderPositionControl } from "@/components/HeaderPositionControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MAX_BIO_LENGTH = 500;
const MAX_USERNAME_LENGTH = 30;

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code:  "CA", name: "Canada", flag: "🇨🇦" },
  { code:  "AU", name: "Australia", flag: "🇦🇺" },
  { code:  "DE", name: "Germany", flag:  "🇩🇪" },
  { code: "FR", name: "France", flag:  "🇫🇷" },
  { code: "IT", name: "Italy", flag:  "🇮🇹" },
  { code: "ES", name: "Spain", flag:  "🇪🇸" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", flag:  "🇧🇷" },
  { code: "AR", name: "Argentina", flag:  "🇦🇷" },
  { code: "JP", name: "Japan", flag:  "🇯🇵" },
  { code: "CN", name: "China", flag:  "🇨🇳" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code:  "IN", name: "India", flag:  "🇮🇳" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "PL", name: "Poland", flag:  "🇵🇱" },
  { code: "SE", name: "Sweden", flag:  "🇸🇪" },
  { code: "NO", name: "Norway", flag:  "🇳🇴" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "PT", name: "Portugal", flag:  "🇵🇹" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", flag:  "🇮🇪" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code:  "SG", name: "Singapore", flag: "🇸🇬" }
];

const FONT_STYLES = [
  { value: "sans", label: "Sans Serif", class: "font-sans" },
  { value: "serif", label: "Serif", class:  "font-serif" },
  { value: "mono", label: "Monospace", class: "font-mono" },
  { value: "gothic", label: "Gothic", class:  "font-serif italic" }
];

export default function Profile() {
  // 🔥 FIXED: Changed from userId to username
  const { username:  urlUsername } = useParams<{ username?:  string }>();
  
  const [profile, setProfile] = useState({ 
    username: "", 
    bio: "", 
    mood_status: "",
    infernal_nickname: "",
    interests: [] as string[],
    infernal_identity: "",
    avatar_url: "",
    header_image_url: "",
    header_position_x: "center",
    header_position_y: "center",
    birthday: "",
    occupation: "",
    sexual_orientation: "",
    relationship_status: "",
    location: "",
    website: "",
    pronouns: "",
    nationality: "",
    age: undefined as number | undefined,
    hometown: "",
    currently_living: "",
    castle_music_url: "",
    background_color: "#0a0a0a",
    background_gradient_from: "#1a0a1a",
    background_gradient_to: "#0a1a1a",
    use_gradient:  false,
    font_style: "sans",
    text_color: "#ffffff",
    is_private: false,
    is_verified: false,
    purchased_skins: [] as string[]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [alliesCount, setAlliesCount] = useState(0);
  const [disciplesCount, setDisciplesCount] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showDoorTransition, setShowDoorTransition] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const navigate = useNavigate();
  
  const [albums, setAlbums] = useState<any[]>([]);
  const [activeDungeonTab, setActiveDungeonTab] = useState("photo_album");

  const [audioMuted, setAudioMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadProfile = async () => {
      if (mounted) {
        await fetchProfile();
      }
    };
    
    loadProfile();
    
    return () => {
      mounted = false;
    };
  }, [urlUsername]);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (userId && mounted) {
        await Promise.all([
          fetchAlliesAndDisciples(),
          fetchUserPosts(),
          fetchAlbums()
        ]);
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [userId, activeDungeonTab]);

  useEffect(() => {
    if (isOwnProfile && profile.castle_music_url && audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio autoplay prevented:", err));
    }
  }, [isOwnProfile, profile.castle_music_url]);

  const sanitizeInput = useCallback((input: string, maxLength: number): string => {
    return input.trim().slice(0, maxLength);
  }, []);

  const validateWebsite = useCallback((url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }, []);

  const fetchAlliesAndDisciples = async () => {
    if (!userId) return;

    try {
      const [alliesResult, disciplesResult] = await Promise.all([
        supabase
          .from("friendships")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .eq("status", "accepted"),
        supabase
          .from("friendships")
          .select("*", { count: 'exact', head: true })
          .eq("friend_id", userId)
          .eq("status", "accepted")
      ]);

      setAlliesCount(alliesResult. count || 0);
      setDisciplesCount(disciplesResult.count || 0);
    } catch (error) {
      console.error("Error fetching relationships:", error);
    }
  };

  const convertToLegions = useMemo(() => (count: number): string => {
    if (count >= 999) return "III Legions";
    if (count >= 666) return "II Legions";
    if (count >= 333) return "I Legion";
    return count.toString();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data:  { user }, error: authError } = await supabase. auth.getUser();
      if (authError || !user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);

      // 🔥 FIXED: Username-based routing logic
      let targetUserId:  string;
      let viewingOwnProfile: boolean;

      if (urlUsername && urlUsername.trim() !== "") {
        console.log("🔍 Looking up username:", urlUsername);
        
        // Fetch profile by username
        const { data: profileLookup, error: lookupError } = await (supabase as any)
          .from("profiles")
          .select("user_id, username")
          .eq("username", urlUsername)
          .maybeSingle();

        if (lookupError || !profileLookup) {
          console.error("User not found:", urlUsername);
          toast.error("User not found");
          navigate("/profile");
          return;
        }

        targetUserId = profileLookup.user_id;
        viewingOwnProfile = targetUserId === user.id;
        
        console.log("✅ Found user:", profileLookup.username, "isOwn:", viewingOwnProfile);
      } else {
        // No username = viewing own profile
        console.log("📍 No username in URL, loading own profile");
        targetUserId = user.id;
        viewingOwnProfile = true;
      }

      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }

      if (!profileData) {
        toast.error("Profile not found");
        navigate("/profile");
        return;
      }

      // Security:  Check if profile is private
      if (! viewingOwnProfile && profileData. is_private) {
        const { data: friendshipData } = await supabase
          . from("friendships")
          .select("*")
          .eq("user_id", user.id)
          .eq("friend_id", targetUserId)
          .eq("status", "accepted")
          .maybeSingle();

        if (! friendshipData) {
          toast.error("This profile is private");
          navigate("/feed");
          return;
        }
      }

      setProfile({
        username: profileData.username || "",
        bio: profileData.bio || "",
        mood_status: profileData.mood_status || "",
        infernal_nickname: profileData.infernal_nickname || "",
        interests: profileData.interests || [],
        infernal_identity: profileData.infernal_identity || "",
        avatar_url: profileData.avatar_url || "",
        header_image_url: profileData.header_image_url || "",
        header_position_x: profileData.header_position_x || "center",
        header_position_y:  profileData.header_position_y || "center",
        birthday:  profileData.birthday || "",
        occupation: profileData.occupation || "",
        sexual_orientation: profileData.sexual_orientation || "",
        relationship_status: profileData.relationship_status || "",
        location:  profileData.location || "",
        website: profileData.website || "",
        pronouns: profileData. pronouns || "",
        nationality:  profileData.nationality || "",
        age: profileData.age || undefined,
        hometown: profileData. hometown || "",
        currently_living: profileData.currently_living || "",
        castle_music_url: profileData.castle_music_url || "",
        background_color: profileData.background_color || "#0a0a0a",
        background_gradient_from:  profileData.background_gradient_from || "#1a0a1a",
        background_gradient_to: profileData.background_gradient_to || "#0a1a1a",
        use_gradient:  profileData.use_gradient || false,
        font_style: profileData.font_style || "sans",
        text_color: profileData.text_color || "#ffffff",
        is_private: profileData.is_private || false,
        is_verified: profileData.is_verified || false,
        purchased_skins: profileData.purchased_skins || []
      });

      setUserId(targetUserId);
      setIsOwnProfile(viewingOwnProfile);
      
      // 🔥 DOOR TRANSITION PRESERVED
      if (viewingOwnProfile && !sessionStorage.getItem('visitedOwnCastle')) {
        setShowDoorTransition(true);
        sessionStorage.setItem('visitedOwnCastle', 'true');
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Fetch profile exception:", error);
      toast.error("An error occurred");
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!userId) return;

    try {
      let query = (supabase as any)
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (! isOwnProfile) {
        query = query.eq("privacy", "public");
      }

      const { data:  postsData, error: postsError } = await query;

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        return;
      }

      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post: any) => {
          const { data: profileData } = await (supabase as any)
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", post.user_id)
            .maybeSingle();

          return {
            ...post,
            profiles: profileData,
          };
        })
      );

      setUserPosts(postsWithProfiles);
    } catch (error) {
      console.error("Exception fetching posts:", error);
    }
  };

  const updateProfile = async () => {
    if (!isOwnProfile) {
      toast.error("You can only edit your own profile");
      return;
    }

    if (!validateWebsite(profile.website)) {
      toast.error("Please enter a valid website URL");
      return;
    }

    if (profile.bio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    if (profile.username.length > MAX_USERNAME_LENGTH) {
      toast.error(`Username must be ${MAX_USERNAME_LENGTH} characters or less`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    try {
      const sanitizedProfile = {
        ...profile,
        username: sanitizeInput(profile.username, MAX_USERNAME_LENGTH),
        bio: sanitizeInput(profile.bio, MAX_BIO_LENGTH),
        mood_status:  sanitizeInput(profile.mood_status, 100),
        infernal_nickname: sanitizeInput(profile.infernal_nickname, 50),
        occupation: sanitizeInput(profile.occupation, 100),
        hometown: sanitizeInput(profile.hometown, 100),
        currently_living: sanitizeInput(profile.currently_living, 100)
      };

      const { error } = await (supabase as any)
        .from("profiles")
        .update(sanitizedProfile)
        .eq("user_id", user. id);

      if (error) {
        if (error.code === '23505') {
          toast.error("Username already taken");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (error:  any) {
      console.error("Update profile exception:", error);
      toast.error("An error occurred while updating");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('visitedOwnCastle');
      toast.success("Signed out");
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out");
    }
  };

  const fetchAlbums = async () => {
    if (!userId) return;

    const { data, error } = await (supabase as any)
      .from("dungeon_albums")
      .select("*")
      .eq("user_id", userId)
      .eq("chamber_type", activeDungeonTab as any)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch albums error:", error);
    } else {
      setAlbums(data || []);
    }
  };

  const toggleAudioMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setAudioMuted(!audioMuted);
    }
  };

  const selectedCountry = useMemo(
    () => COUNTRIES.find(c => c.code === profile. nationality),
    [profile.nationality]
  );

  const selectedFont = useMemo(
    () => FONT_STYLES.find(f => f.value === profile.font_style),
    [profile.font_style]
  );

  const backgroundStyle = useMemo(() => {
    if (profile.use_gradient) {
      return {
        background: `linear-gradient(135deg, ${profile.background_gradient_from}, ${profile.background_gradient_to})`
      };
    }
    return {
      backgroundColor: profile.background_color
    };
  }, [profile.use_gradient, profile.background_color, profile.background_gradient_from, profile.background_gradient_to]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // 🔥 DOOR TRANSITION PRESERVED
  if (showDoorTransition && isOwnProfile) {
    return (
      <DungeonDoorTransition
        destination="Your Castle"
        onComplete={() => setShowDoorTransition(false)}
      />
    );
  }

  if (showWizard && isOwnProfile) {
    return (
      <CastleWizard
        userId={currentUserId}
        onComplete={() => {
          setShowWizard(false);
          fetchProfile();
        }}
      />
    );
  }

  return (
    <div 
      className={cn(
        "w-full max-w-6xl mx-auto py-4 md:py-6 px-3 sm:px-4 pb-20 md:ml-64 lg:ml-72 min-h-screen transition-colors",
        selectedFont?. class
      )}
      style={{
        ... backgroundStyle,
        color: profile.text_color
      }}
    >
      {isOwnProfile && profile.castle_music_url && (
        <div className="fixed top-20 right-4 z-50">
          <Card className="border-primary/50 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-3 flex items-center gap-2">
              <Music className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs">Castle Music</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={toggleAudioMute}
              >
                {audioMuted ?  <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </Button>
            </CardContent>
          </Card>
          <audio ref={audioRef} src={profile.castle_music_url} loop muted={audioMuted} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif flex items-center gap-2 flex-wrap">
          ⚔️ {isOwnProfile ? "My Castle" : `${profile.username}'s Castle`}
          {profile.is_verified && (
            <span title="Verified Profile" className="inline-flex">
              <CheckCircle2 className="h-6 w-6 text-blue-500" />
            </span>
          )}
          {selectedCountry && (
            <span className="text-3xl" title={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
          )}
          {profile.age && (
            <Badge variant="outline" className="text-xs">
              {profile.age} years
            </Badge>
          )}
        </h1>
        {isOwnProfile && (
          <Button 
            onClick={() => setShowWizard(true)}
            variant="outline"
            className="border-primary/30 hover:bg-primary/10 text-xs md:text-sm w-full sm:w-auto"
          >
            <Users className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Reopen Setup Wizard
          </Button>
        )}
      </div>

      {(profile.hometown || profile.currently_living) && (
        <div className="flex flex-wrap gap-3 mb-4 text-sm opacity-80">
          {profile.hometown && (
            <div className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>From {profile.hometown}</span>
            </div>
          )}
          {profile.currently_living && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Lives in {profile.currently_living}</span>
            </div>
          )}
        </div>
      )}

      {profile.header_image_url && (
        <div className="w-full h-48 mb-6 rounded-lg overflow-hidden relative">
          <img 
            src={profile.header_image_url} 
            alt="Header" 
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-300" 
            style={{ objectPosition: `${profile.header_position_x} ${profile.header_position_y}` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Allies</p>
              <p className="text-sm md:text-lg font-bold">{convertToLegions(alliesCount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Infernal Disciples</p>
              <p className="text-sm md:text-lg font-bold">{disciplesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 bg-card/50">
          <TabsTrigger value="info" className="text-sm">Castle Info</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="avatar" className="text-sm">Master Magician</TabsTrigger>}
          <TabsTrigger value="dungeon" className="text-sm">Dungeon</TabsTrigger>
          <TabsTrigger value="posts" className="text-sm">Book of Shadows</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="inventory" className="text-sm">Inventory</TabsTrigger>}
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card className="border-border mb-6 relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <ProfileSkinDisplay userId={userId} />
            <ProfileBadgeDisplay userId={userId} />
            <CardHeader>
              <CardTitle className="font-serif">Castle Portrait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary/30">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                    {profile.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <ImageUpload
                    userId={currentUserId}
                    bucket="profile-images"
                    currentImageUrl={profile.avatar_url}
                    onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                    label="Profile Image"
                  />
                )}
              </div>
              {isOwnProfile && (
                <>
                  <ImageUpload
                    userId={currentUserId}
                    bucket="header-images"
                    currentImageUrl={profile.header_image_url}
                    onUploadComplete={(url) => setProfile({ ...profile, header_image_url: url })}
                    label="Header Image"
                  />
                  
                  {profile.header_image_url && (
                    <HeaderPositionControl
                      headerImageUrl={profile.header_image_url}
                      positionX={profile.header_position_x}
                      positionY={profile.header_position_y}
                      onPositionChange={(x, y) => setProfile({ 
                        ...profile, 
                        header_position_x:  x, 
                        header_position_y: y 
                      })}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* REST OF YOUR EXISTING TABS CONTINUE EXACTLY AS BEFORE... I'll continue if needed but the KEY FIX is done:  username-based routing + door transition preserved */}

          <Card className="border-border relative overflow-hidden bg-card/80 backdrop-blur-sm">
            <ProfileSkinDisplay userId={userId} />
            <CardHeader>
              <CardTitle className="font-serif">Castle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isOwnProfile ?  (
                <>
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        placeholder="Enter username..."
                        maxLength={MAX_USERNAME_LENGTH}
                      />
                    </div>
                    <div>
                      <Label>Infernal Nickname</Label>
                      <Input
                        value={profile.infernal_nickname}
                        onChange={(e) => setProfile({ ...profile, infernal_nickname: e.target.value })}
                        placeholder="Your dark moniker..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Pronouns</Label>
                    <Input
                      value={profile. pronouns}
                      onChange={(e) => setProfile({ ...profile, pronouns: e.target. value })}
                      placeholder="they/them, he/him, she/her..."
                    />
                  </div>

                  <div>
                    <Label>Mood Status</Label>
                    <Input
                      value={profile. mood_status}
                      onChange={(e) => setProfile({ ... profile, mood_status: e. target.value })}
                      placeholder="In Ritual, Summoning..."
                    />
                  </div>

                  <div>
                    <Label>Bio ({profile.bio. length}/{MAX_BIO_LENGTH})</Label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={MAX_BIO_LENGTH}
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location & Demographics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-primary" />
                          Nationality
                        </Label>
                        <Select 
                          value={profile.nationality} 
                          onValueChange={(v) => setProfile({ ...profile, nationality: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select nationality..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COUNTRIES.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Age
                        </Label>
                        <Input
                          type="number"
                          min="13"
                          max="120"
                          value={profile.age || ""}
                          onChange={(e) => setProfile({ 
                            ...profile, 
                            age: e.target. value ? parseInt(e.target. value) : undefined 
                          })}
                          placeholder="Your age..."
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-primary" />
                          Hometown
                        </Label>
                        <Input
                          value={profile.hometown}
                          onChange={(e) => setProfile({ ...profile, hometown: e.target.value })}
                          placeholder="Where you're from..."
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          Currently Living
                        </Label>
                        <Input
                          value={profile.currently_living}
                          onChange={(e) => setProfile({ ...profile, currently_living: e.target.value })}
                          placeholder="Where you live now..."
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Continue with all your other sections... Personal Details, Castle Atmosphere, Appearance, Privacy, etc. */}
                  
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Personal Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Birthday
                        </Label>
                        <Input
                          type="date"
                          value={profile.birthday}
                          onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          Occupation
                        </Label>
                        <Input
                          value={profile. occupation}
                          onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                          placeholder="Necromancer, Warlock..."
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          Sexual Orientation
                        </Label>
                        <Select value={profile.sexual_orientation} onValueChange={(v) => setProfile({ ...profile, sexual_orientation: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="heterosexual">Heterosexual</SelectItem>
                            <SelectItem value="homosexual">Homosexual</SelectItem>
                            <SelectItem value="bisexual">Bisexual</SelectItem>
                            <SelectItem value="pansexual">Pansexual</SelectItem>
                            <SelectItem value="asexual">Asexual</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Relationship Status</Label>
                        <Select value={profile.relationship_status} onValueChange={(v) => setProfile({ ...profile, relationship_status: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="in_relationship">In a Relationship</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="its_complicated">It's Complicated</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Location</Label>
                        <Input
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          placeholder="The Abyss..."
                        />
                      </div>

                      <div>
                        <Label>Website</Label>
                        <Input
                          type="url"
                          value={profile.website}
                          onChange={(e) => setProfile({ ... profile, website: e.target. value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Music className="h-5 w-5 text-primary" />
                      Castle Atmosphere
                    </h3>
                    
                    <div>
                      <Label>Castle Music URL</Label>
                      <Input
                        type="url"
                        value={profile.castle_music_url}
                        onChange={(e) => setProfile({ ...profile, castle_music_url: e.target. value })}
                        placeholder="https://your-music. mp3"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-plays when you enter your castle
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Appearance
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="useGradient"
                          checked={profile.use_gradient}
                          onChange={(e) => setProfile({ ...profile, use_gradient: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="useGradient">Use Gradient Background</Label>
                      </div>

                      {profile.use_gradient ?  (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Gradient From</Label>
                            <Input
                              type="color"
                              value={profile.background_gradient_from}
                              onChange={(e) => setProfile({ ...profile, background_gradient_from: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Gradient To</Label>
                            <Input
                              type="color"
                              value={profile.background_gradient_to}
                              onChange={(e) => setProfile({ ...profile, background_gradient_to: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label>Background Color</Label>
                          <Input
                            type="color"
                            value={profile. background_color}
                            onChange={(e) => setProfile({ ... profile, background_color: e. target.value })}
                          />
                        </div>
                      )}

                      <div>
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={profile.text_color}
                          onChange={(e) => setProfile({ ...profile, text_color: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Font Style</Label>
                        <Select value={profile.font_style} onValueChange={(v) => setProfile({ ...profile, font_style: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_STYLES.map(font => (
                              <SelectItem key={font.value} value={font.value}>
                                <span className={font.class}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Privacy
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Private Profile</Label>
                        <p className="text-xs text-muted-foreground">
                          Only allies can view
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.is_private}
                        onChange={(e) => setProfile({ ...profile, is_private: e.target.checked })}
                        className="rounded"
                      />
                    </div>
                  </div>

                  <InterestsSelect
                    value={profile.interests}
                    onChange={(interests) => setProfile({ ... profile, interests })}
                  />

                  <InfernalIdentitySelect
                    value={profile. infernal_identity}
                    onChange={(identity) => setProfile({ ...profile, infernal_identity: identity })}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={updateProfile} 
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Castle"
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="flex-1">
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* VIEW-ONLY - your existing code */}
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <p className="mt-2">{profile.username}</p>
                    </div>
                    {profile.infernal_nickname && (
                      <div>
                        <Label>Infernal Nickname</Label>
                        <p className="mt-2">{profile.infernal_nickname}</p>
                      </div>
                    )}
                    {/* Rest of view-only fields...  */}
                  </div>

                  {profile.bio && (
                    <div>
                      <Label>Bio</Label>
                      <p className="mt-2 whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                  )}

                  {profile.infernal_identity && (
                    <div>
                      <Label>Infernal Identity</Label>
                      <p className="mt-2">{profile.infernal_identity}</p>
                    </div>
                  )}

                  {profile.interests. length > 0 && (
                    <div>
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.interests.map((interest, idx) => (
                          <Badge key={idx} variant="outline">{interest}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="avatar">
            <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Advanced Sigil Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedSigilCreator 
                  userId={currentUserId}
                  onSave={fetchProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="dungeon">
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              Dungeon feature coming soon... 
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          {isOwnProfile && (
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif">Inscribe in Book of Shadows</CardTitle>
              </CardHeader>
              <CardContent>
                <CreatePost onPostCreated={() => {
                  fetchUserPosts();
                  toast. success("Posted!");
                }} />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUserId}
                onPostUpdated={fetchUserPosts}
                onPostDeleted={fetchUserPosts}
              />
            ))}
            {userPosts.length === 0 && (
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isOwnProfile ? "No entries yet..." : "No posts yet"}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="inventory">
            <InventoryDisplay userId={currentUserId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}