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
  Users, TrendingUp, User, Lock, Calendar, 
  Briefcase, Heart, Flag, Home, MapPin, Music, Volume2, VolumeX,
  Loader2, Palette, Shield, CheckCircle2, Crown, Wand2, ExternalLink,
  UserPlus, MessageCircle, UserMinus, Clock
} from "lucide-react";
import { HeaderPositionControl } from "@/components/HeaderPositionControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MAX_BIO_LENGTH = 500;
const MAX_USERNAME_LENGTH = 30;
const MAX_MOOD_STATUS_LENGTH = 100;
const MAX_INFERNAL_NICKNAME_LENGTH = 50;
const MAX_OCCUPATION_LENGTH = 100;
const MAX_LOCATION_LENGTH = 255;

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code:  "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag:  "🇩🇪" },
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
  { code:  "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "PT", name: "Portugal", flag:  "🇵🇹" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", flag:  "🇮🇪" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" }
];

const FONT_STYLES = [
  { value: "sans", label: "Sans Serif", class: "font-sans" },
  { value: "serif", label: "Serif", class: "font-serif" },
  { value: "mono", label: "Monospace", class: "font-mono" },
  { value: "gothic", label: "Gothic", class:  "font-serif italic" }
];

interface ProfileState {
  username: string;
  bio: string;
  mood_status: string;
  infernal_nickname:  string;
  interests: string[];
  infernal_identity: string;
  avatar_url: string;
  header_image_url: string;
  header_position_x: string;
  header_position_y: string;
  birthday: string | null;
  occupation: string;
  sexual_orientation: string;
  relationship_status: string;
  location: string;
  website: string;
  pronouns: string;
  nationality: string;
  age: number | undefined;
  hometown: string;
  currently_living: string;
  castle_music_url: string;
  background_color: string;
  background_gradient_from: string;
  background_gradient_to: string;
  use_gradient: boolean;
  font_style: string;
  text_color: string;
  is_private: boolean;
  is_verified: boolean;
  purchased_skins: string[];
}

const DEFAULT_PROFILE: ProfileState = {
  username:  "",
  bio: "",
  mood_status: "",
  infernal_nickname: "",
  interests: [],
  infernal_identity: "",
  avatar_url:  "",
  header_image_url: "",
  header_position_x: "center",
  header_position_y: "center",
  birthday:  null,
  occupation: "",
  sexual_orientation: "",
  relationship_status: "",
  location:  "",
  website: "",
  pronouns: "",
  nationality:  "",
  age: undefined,
  hometown: "",
  currently_living: "",
  castle_music_url: "",
  background_color: "#0a0a0a",
  background_gradient_from: "#1a0a1a",
  background_gradient_to: "#0a1a1a",
  use_gradient:  false,
  font_style:  "sans",
  text_color: "#ffffff",
  is_private: false,
  is_verified: false,
  purchased_skins: []
};

export default function Profile() {
  const { username:  urlUsername } = useParams<{ username?:  string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
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
  const [albums, setAlbums] = useState<any[]>([]);
  const [activeDungeonTab, setActiveDungeonTab] = useState("photo_album");
  const [audioMuted, setAudioMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (mounted) await fetchProfile();
    };
    loadProfile();
    return () => { mounted = false; };
  }, [urlUsername]);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (userId && mounted) {
        await Promise.all([
          fetchAlliesAndDisciples(),
          fetchUserPosts(),
          fetchAlbums(),
          fetchFriendshipStatus()
        ]);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [userId, activeDungeonTab, currentUserId]);

  useEffect(() => {
    if (isOwnProfile && profile.castle_music_url && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.warn("Audio autoplay prevented:", err. message);
      });
    }
  }, [isOwnProfile, profile.castle_music_url]);

  const sanitizeInput = useCallback((input: string, maxLength: number): string => {
    return input.trim().slice(0, maxLength);
  }, []);

  const validateWebsite = useCallback((url: string): boolean => {
    if (!url) return true;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  const sanitizeBirthday = useCallback((birthday:  string): string | null => {
    return birthday. trim() === "" ? null : birthday;
  }, []);

  const fetchAlliesAndDisciples = async (): Promise<void> => {
    if (!userId) return;
    try {
      const [alliesResult, disciplesResult] = await Promise.all([
        supabase
          .from("friendships")
          .select("*", { count: "exact", head:  true })
          .eq("user_id", userId)
          .eq("status", "accepted"),
        supabase
          . from("friendships")
          .select("*", { count: "exact", head: true })
          .eq("friend_id", userId)
          .eq("status", "accepted")
      ]);

      setAlliesCount(alliesResult. count || 0);
      setDisciplesCount(disciplesResult.count || 0);
    } catch (error) {
      console.error("Error fetching relationships:", error);
      toast. error("Failed to load relationship counts");
    }
  };

  const fetchFriendshipStatus = async (): Promise<void> => {
    if (!currentUserId || !userId || isOwnProfile) return;

    try {
      const { data, error } = await supabase
  .from("friendships")
  .select("id, status, user_id, friend_id")
  .or(`user_id.eq.${currentUserId},user_id.eq.${userId}`)
  .or(`friend_id.eq.${currentUserId},friend_id.eq.${userId}`)
  .limit(1);
      if (error) throw error;

      if (data && data.length > 0) {
        const friendship = data[0];
        
        if (friendship.user_id === currentUserId) {
          setFriendshipStatus(friendship.status);
          setFriendshipId(friendship.id);
        } else {
          setFriendshipStatus(friendship. status === 'pending' ? 'received' : friendship.status);
          setFriendshipId(friendship.id);
        }
      } else {
        setFriendshipStatus(null);
        setFriendshipId(null);
      }
    } catch (error) {
      console.error("Error fetching friendship status:", error);
    }
  };

  const handleSendFriendRequest = async (): Promise<void> => {
    if (!currentUserId || ! userId || isOwnProfile) return;

    setSendingRequest(true);
    
    try {
      const { data:  existing, error: checkError } = await supabase
        .from("friendships")
        .select("id, status, user_id, friend_id")
        .or(`user_id.eq.${currentUserId},user_id.eq.${userId}`)
        .or(`friend_id.eq.${currentUserId},friend_id.eq.${userId}`);

      if (checkError) {
        console.error("Check friendship error:", checkError);
        throw checkError;
      }

      if (existing && existing.length > 0) {
        const friendship = existing[0];
        
        if (friendship.status === 'pending') {
          if (friendship.user_id === currentUserId) {
            toast.error("Friend request already sent");
          } else {
            toast.error("This user already sent you a request - check Pending tab in Allies");
          }
        } else if (friendship.status === 'accepted') {
          toast.error("You're already allies with this user");
        } else {
          toast.error("A friendship request already exists");
        }
        setSendingRequest(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("friendships")
        .insert({
          user_id: currentUserId,
          friend_id:  userId,
          status: "pending"
        });

      if (insertError) {
        console.error("Insert friendship error:", insertError);
        
        if (insertError.code === "23505") {
          toast.error("Friend request already sent");
        } else {
          throw insertError;
        }
        setSendingRequest(false);
        return;
      }

      setFriendshipStatus("pending");
      toast.success(`Ally request sent to ${profile.username}!  🖤`);
      await fetchFriendshipStatus();
      
    } catch (error:  any) {
      console.error("Error sending friend request:", error);
      toast.error(error.message || "Failed to send ally request");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleCancelFriendRequest = async (): Promise<void> => {
    if (!friendshipId) return;

    setSendingRequest(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      setFriendshipStatus(null);
      setFriendshipId(null);
      toast.success("Ally request cancelled");
    } catch (error:  any) {
      console.error("Error cancelling request:", error);
      toast.error(error.message || "Failed to cancel request");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleRemoveFriend = async (): Promise<void> => {
    if (!friendshipId) return;

    setSendingRequest(true);
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      setFriendshipStatus(null);
      setFriendshipId(null);
      toast.success("Ally removed");
      await fetchAlliesAndDisciples();
    } catch (error: any) {
      console.error("Error removing friend:", error);
      toast.error(error.message || "Failed to remove ally");
    } finally {
      setSendingRequest(false);
    }
  };

  const convertToLegions = useMemo(() => (count: number): string => {
    if (count >= 999) return "III Legions";
    if (count >= 666) return "II Legions";
    if (count >= 333) return "I Legion";
    return count.toString();
  }, []);

  const fetchProfile = async (): Promise<void> => {
    try {
      const { data: { user }, error:  authError } = await supabase. auth.getUser();
      if (authError || !user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user. id);

      let targetUserId:  string;
      let viewingOwnProfile: boolean;

      if (urlUsername && urlUsername.trim() !== "") {
        const { data: profileLookup, error: lookupError } = await supabase
          .from("profiles")
          .select("user_id, username")
          .eq("username", urlUsername)
          .maybeSingle();

        if (lookupError || !profileLookup) {
          toast.error("User not found");
          navigate("/profile");
          return;
        }

        targetUserId = profileLookup.user_id;
        viewingOwnProfile = targetUserId === user.id;
      } else {
        targetUserId = user. id;
        viewingOwnProfile = true;
      }

      const { data: profileData, error: profileError } = await supabase
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

      if (! profileData) {
        toast.error("Profile not found");
        navigate("/profile");
        return;
      }

      if (! viewingOwnProfile && profileData.is_private) {
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
        bio: profileData. bio || "",
        mood_status: profileData.mood_status || "",
        infernal_nickname:  profileData.infernal_nickname || "",
        interests: Array.isArray(profileData.interests) ? profileData.interests : [],
        infernal_identity: profileData.infernal_identity || "",
        avatar_url: profileData.avatar_url || "",
        header_image_url: profileData.header_image_url || "",
        header_position_x:  profileData.header_position_x || "center",
        header_position_y: profileData.header_position_y || "center",
        birthday: profileData.birthday || null,
        occupation: profileData.occupation || "",
        sexual_orientation: profileData.sexual_orientation || "",
        relationship_status: profileData.relationship_status || "",
        location: profileData. location || "",
        website: profileData.website || "",
        pronouns: profileData.pronouns || "",
        nationality: profileData. nationality || "",
        age: profileData.age || undefined,
        hometown: profileData.hometown || "",
        currently_living: profileData.currently_living || "",
        castle_music_url: profileData.castle_music_url || "",
        background_color: profileData.background_color || "#0a0a0a",
        background_gradient_from: profileData.background_gradient_from || "#1a0a1a",
        background_gradient_to: profileData.background_gradient_to || "#0a1a1a",
        use_gradient: profileData.use_gradient || false,
        font_style:  profileData.font_style || "sans",
        text_color:  profileData.text_color || "#ffffff",
        is_private:  profileData.is_private || false,
        is_verified: profileData.is_verified || false,
        purchased_skins: Array.isArray(profileData.purchased_skins) ? profileData.purchased_skins : []
      });

      setUserId(targetUserId);
      setIsOwnProfile(viewingOwnProfile);
      if (viewingOwnProfile) {
        setShowDoorTransition(true);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch profile exception:", error);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const fetchUserPosts = async (): Promise<void> => {
    if (!userId) return;
    try {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (! isOwnProfile) {
        query = query.eq("privacy", "public");
      }

      const { data: postsData, error: postsError } = await query;

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        toast.error("Failed to load posts");
        return;
      }

      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post: any) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", post.user_id)
            .maybeSingle();
          return { ...post, profiles: profileData };
        })
      );

      setUserPosts(postsWithProfiles);
    } catch (error) {
      console.error("Exception fetching posts:", error);
      toast.error("Failed to load posts");
    }
  };

  const updateProfile = async (): Promise<void> => {
    if (!isOwnProfile) {
      toast.error("You can only edit your own profile");
      return;
    }

    if (!validateWebsite(profile.website)) {
      toast.error("Please enter a valid website URL (https://...)");
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
    if (profile.age !== undefined && (profile.age < 13 || profile.age > 120)) {
      toast.error("Age must be between 13 and 120");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    try {
      const sanitizedProfile = {
        username: sanitizeInput(profile.username, MAX_USERNAME_LENGTH),
        bio: sanitizeInput(profile.bio, MAX_BIO_LENGTH),
        mood_status:  sanitizeInput(profile.mood_status, MAX_MOOD_STATUS_LENGTH),
        infernal_nickname: sanitizeInput(profile.infernal_nickname, MAX_INFERNAL_NICKNAME_LENGTH),
        occupation: sanitizeInput(profile.occupation, MAX_OCCUPATION_LENGTH),
        hometown: sanitizeInput(profile.hometown, MAX_LOCATION_LENGTH),
        currently_living: sanitizeInput(profile.currently_living, MAX_LOCATION_LENGTH),
        location: sanitizeInput(profile.location, MAX_LOCATION_LENGTH),
        website: profile.website. trim(),
        pronouns: profile.pronouns.trim(),
        birthday: sanitizeBirthday(profile.birthday || ""),
        sexual_orientation:  profile.sexual_orientation,
        relationship_status: profile. relationship_status,
        nationality: profile.nationality,
        age: profile.age || null,
        interests: profile.interests,
        infernal_identity: profile.infernal_identity,
        avatar_url: profile.avatar_url,
        header_image_url: profile.header_image_url,
        header_position_x: profile.header_position_x,
        header_position_y: profile.header_position_y,
        castle_music_url: profile.castle_music_url,
        background_color: profile.background_color,
        background_gradient_from: profile.background_gradient_from,
        background_gradient_to: profile.background_gradient_to,
        use_gradient: profile.use_gradient,
        font_style: profile.font_style,
        text_color: profile.text_color,
        is_private: profile.is_private,
        purchased_skins: profile.purchased_skins
      };

      const { error } = await supabase
        .from("profiles")
        .update(sanitizedProfile)
        .eq("user_id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Username already taken");
        } else {
          console.error("Update error:", error);
          toast.error(error.message || "Failed to update profile");
        }
      } else {
        toast.success("Profile updated successfully!  🖤");
      }
    } catch (error:  any) {
      console.error("Update profile exception:", error);
      toast.error("An unexpected error occurred while updating");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await supabase. auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out");
    }
  };

  const fetchAlbums = async (): Promise<void> => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("dungeon_albums")
        .select("*")
        .eq("user_id", userId)
        .eq("chamber_type", activeDungeonTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error("Fetch albums error:", error);
    }
  };

  const toggleAudioMute = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setAudioMuted(!audioMuted);
    }
  }, [audioMuted]);

  const selectedCountry = useMemo(
    () => COUNTRIES.find(c => c. code === profile.nationality),
    [profile.nationality]
  );

  const selectedFont = useMemo(
    () => FONT_STYLES.find(f => f.value === profile.font_style),
    [profile.font_style]
  );

  const backgroundStyle = useMemo(() => {
    if (profile. use_gradient) {
      return {
        background: `linear-gradient(135deg, ${profile.background_gradient_from}, ${profile.background_gradient_to})`
      };
    }
    return { backgroundColor: profile.background_color };
  }, [profile.use_gradient, profile.background_color, profile.background_gradient_from, profile.background_gradient_to]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-crimson" />
      </div>
    );
  }

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
        "w-full max-w-7xl mx-auto py-6 md:py-8 px-4 sm:px-6 pb-20 md:ml-64 lg:ml-72 min-h-screen transition-colors",
        selectedFont?. class
      )}
      style={{
        ... backgroundStyle,
        color: profile.text_color
      }}
    >
      {isOwnProfile && profile.castle_music_url && (
        <div className="fixed top-20 right-4 z-50">
          <div className="border-2 border-crimson/50 bg-slate-950/90 backdrop-blur-md rounded-lg p-4 shadow-2xl shadow-crimson/20">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-crimson animate-pulse" />
              <span className="text-sm font-bold text-white">🎵 Castle Ambiance</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-crimson hover:text-crimson hover:bg-crimson/10"
                onClick={toggleAudioMute}
                aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
              >
                {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <audio ref={audioRef} src={profile.castle_music_url} loop muted={audioMuted} />
        </div>
      )}

      <div className="mb-8">
        <div className="border-b-2 border-crimson/30 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Crown className="h-8 w-8 text-crimson animate-pulse" />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-white">
                  {isOwnProfile ? "My Castle" : `${profile.username}'s Castle`}
                </h1>
                {profile.mood_status && (
                  <p className="text-crimson font-gothic mt-2">~ {profile.mood_status} ~</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {isOwnProfile ?  (
                <Button 
                  onClick={() => setShowWizard(true)}
                  className="bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white border border-crimson/50"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Setup Wizard
                </Button>
              ) : (
                <>
                  {friendshipStatus === null && (
                    <Button 
                      onClick={handleSendFriendRequest}
                      disabled={sendingRequest}
                      className="bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white border border-crimson/50"
                    >
                      {sendingRequest ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Add Ally
                    </Button>
                  )}
                  
                  {friendshipStatus === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        disabled
                        variant="outline"
                        className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Request Sent
                      </Button>
                      <Button
                        onClick={handleCancelFriendRequest}
                        disabled={sendingRequest}
                        variant="ghost"
                        className="text-crimson hover:bg-crimson/10"
                      >
                        {sendingRequest ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </div>
                  )}

                  {friendshipStatus === "received" && (
                    <Button 
                      onClick={() => navigate('/allies')}
                      variant="outline"
                      className="border-green-500/50 text-green-500 bg-green-500/10"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Accept Request in Allies
                    </Button>
                  )}
                                    
                  {friendshipStatus === "accepted" && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/chat? user=${profile.username}`)}
                        variant="outline"
                        className="border-crimson/30 text-crimson hover:bg-crimson/10"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        onClick={handleRemoveFriend}
                        disabled={sendingRequest}
                        variant="ghost"
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        {sendingRequest ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Ally
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile.is_verified && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-blue-500/50 bg-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-blue-300 font-bold">Verified</span>
              </div>
            )}
            {selectedCountry && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-crimson/30 bg-crimson/5">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-xs text-crimson/80">{selectedCountry.name}</span>
              </div>
            )}
            {profile.age && (
              <Badge variant="outline" className="border-crimson/30 text-crimson bg-crimson/5">
                {profile.age} years
              </Badge>
            )}
            {profile.is_private && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-purple-500/50 bg-purple-500/10">
                <Lock className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-purple-300 font-bold">Private</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {profile.header_image_url && (
        <div className="mb-8 rounded-lg overflow-hidden border-2 border-crimson/20">
          <div className="w-full h-56 relative">
            <img 
              src={profile.header_image_url} 
              alt="Profile header" 
              loading="lazy"
              className="w-full h-full object-cover" 
              style={{ objectPosition: `${profile.header_position_x} ${profile.header_position_y}` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md: grid-cols-2 gap-4 mb-8">
        <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 p-6 hover:border-crimson/60 transition-all hover:shadow-lg hover:shadow-crimson/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-crimson/70 text-sm font-bold uppercase tracking-wider">Allies</p>
              <p className="text-4xl font-bold text-white mt-2">{convertToLegions(alliesCount)}</p>
            </div>
            <Users className="h-12 w-12 text-crimson/40" />
          </div>
        </div>
        <div className="border-2 border-purple-500/30 rounded-lg bg-slate-900/40 p-6 hover:border-purple-500/60 transition-all hover:shadow-lg hover: shadow-purple-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300/70 text-sm font-bold uppercase tracking-wider">Infernal Disciples</p>
              <p className="text-4xl font-bold text-white mt-2">{disciplesCount}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500/40" />
          </div>
        </div>
      </div>

      {(profile.hometown || profile.currently_living) && (
        <div className="mb-8 border-2 border-crimson/20 rounded-lg bg-slate-900/30 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {profile.hometown && (
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-crimson" />
                <div>
                  <p className="text-crimson/60 text-xs uppercase font-bold">Hometown</p>
                  <p className="text-white font-semibold">{profile.hometown}</p>
                </div>
              </div>
            )}
            {profile.currently_living && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-crimson" />
                <div>
                  <p className="text-crimson/60 text-xs uppercase font-bold">Currently Living</p>
                  <p className="text-white font-semibold">{profile.currently_living}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Tabs defaultValue="info" className="space-y-6">
        <div className="border-b border-crimson/20">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-transparent">
            <TabsTrigger value="info" className="border-b-2 border-transparent data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=active]:bg-transparent rounded-none">📜 Castle Info</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="avatar" className="border-b-2 border-transparent data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=active]:bg-transparent rounded-none">✨ Avatar</TabsTrigger>}
            <TabsTrigger value="dungeon" className="border-b-2 border-transparent data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=active]:bg-transparent rounded-none">🏴 Dungeon</TabsTrigger>
            <TabsTrigger value="posts" className="border-b-2 border-transparent data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=active]:bg-transparent rounded-none">📖 Shadows</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="inventory" className="border-b-2 border-transparent data-[state=active]:border-crimson data-[state=active]:text-crimson data-[state=active]:bg-transparent rounded-none">💎 Inventory</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="info" className="space-y-8">
          <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
            <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <User className="h-6 w-6 text-crimson" />
                Castle Portrait
              </h2>
            </div>
            <div className="p-8">
              <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <Avatar className="h-32 w-32 border-4 border-crimson/40 ring-4 ring-crimson/20 shadow-xl shadow-crimson/30">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  <AvatarFallback className="bg-gradient-to-br from-crimson/20 to-purple-900/20 text-crimson text-4xl font-serif border border-crimson/40">
                    {profile.username[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <div className="flex-1 space-y-4">
                    <ImageUpload
                      userId={currentUserId}
                      bucket="profile-images"
                      currentImageUrl={profile.avatar_url}
                      onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                      label="Profile Image"
                    />
                    <ImageUpload
                      userId={currentUserId}
                      bucket="header-images"
                      currentImageUrl={profile.header_image_url}
                      onUploadComplete={(url) => setProfile({ ...profile, header_image_url: url })}
                      label="Header Image"
                    />
                  </div>
                )}
              </div>
              {isOwnProfile && profile.header_image_url && (
                <div className="mt-8 p-6 border border-crimson/20 rounded-lg bg-slate-900/50">
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
                </div>
              )}
            </div>
          </div>

          <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
            <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <Shield className="h-6 w-6 text-crimson" />
                Profile Details
              </h2>
            </div>
            <div className="p-8 space-y-8">
              {isOwnProfile ?  (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-crimson/20 pb-3">Personal Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Username</Label>
                        <Input
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          placeholder="Enter username..."
                          maxLength={MAX_USERNAME_LENGTH}
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder: text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Infernal Nickname</Label>
                        <Input
                          value={profile.infernal_nickname}
                          onChange={(e) => setProfile({ ... profile, infernal_nickname: e.target.value })}
                          placeholder="Your dark moniker..."
                          maxLength={MAX_INFERNAL_NICKNAME_LENGTH}
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus: border-crimson focus:ring-crimson/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Pronouns</Label>
                      <Input
                        value={profile. pronouns}
                        onChange={(e) => setProfile({ ...profile, pronouns: e.target. value })}
                        placeholder="they/them, he/him, she/her..."
                        className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                      />
                    </div>
                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Mood Status</Label>
                      <Input
                        value={profile.mood_status}
                        onChange={(e) => setProfile({ ...profile, mood_status: e.target.value })}
                        placeholder="In Ritual, Summoning..."
                        maxLength={MAX_MOOD_STATUS_LENGTH}
                        className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus: border-crimson focus:ring-crimson/50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-crimson font-bold uppercase text-xs">Bio ({profile.bio.length}/{MAX_BIO_LENGTH})</Label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={5}
                      maxLength={MAX_BIO_LENGTH}
                      className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50 resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-crimson/20 pb-3">Location & Demographics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Nationality
                        </Label>
                        <Select value={profile.nationality} onValueChange={(v) => setProfile({ ...profile, nationality: v })}>
                          <SelectTrigger className="bg-slate-800/80 border-crimson/30 text-white mt-2 focus:border-crimson focus:ring-crimson/50">
                            <SelectValue placeholder="Select nationality..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-crimson/30">
                            {COUNTRIES.map(country => (
                              <SelectItem key={country.code} value={country.code} className="text-white hover:bg-crimson/20 focus:bg-crimson/20">
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Age
                        </Label>
                        <Input
                          type="number"
                          min="13"
                          max="120"
                          value={profile.age || ""}
                          onChange={(e) => setProfile({ ...profile, age: e.target.value ?  parseInt(e.target.value) : undefined })}
                          placeholder="Your age..."
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          Hometown
                        </Label>
                        <Input
                          value={profile.hometown}
                          onChange={(e) => setProfile({ ... profile, hometown: e.target. value })}
                          placeholder="Where you're from..."
                          maxLength={100}
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Currently Living
                        </Label>
                        <Input
                          value={profile.currently_living}
                          onChange={(e) => setProfile({ ...profile, currently_living: e.target.value })}
                          placeholder="Where you live now..."
                          maxLength={100}
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-crimson/20 pb-3">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Birthday
                        </Label>
                        <Input
                          type="date"
                          value={profile. birthday || ""}
                          onChange={(e) => setProfile({ ... profile, birthday: e.target. value || null })}
                          className="bg-slate-800/80 border-crimson/30 text-white mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Occupation
                        </Label>
                        <Input
                          value={profile.occupation}
                          onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                          placeholder="Necromancer, Warlock..."
                          maxLength={MAX_OCCUPATION_LENGTH}
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Sexual Orientation
                        </Label>
                        <Select value={profile.sexual_orientation} onValueChange={(v) => setProfile({ ...profile, sexual_orientation: v })}>
                          <SelectTrigger className="bg-slate-800/80 border-crimson/30 text-white mt-2 focus:border-crimson focus:ring-crimson/50">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-crimson/30">
                            <SelectItem value="heterosexual" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Heterosexual</SelectItem>
                            <SelectItem value="homosexual" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Homosexual</SelectItem>
                            <SelectItem value="bisexual" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Bisexual</SelectItem>
                            <SelectItem value="pansexual" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Pansexual</SelectItem>
                            <SelectItem value="asexual" className="text-white hover:bg-crimson/20 focus: bg-crimson/20">Asexual</SelectItem>
                            <SelectItem value="other" className="text-white hover: bg-crimson/20 focus:bg-crimson/20">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Relationship Status</Label>
                        <Select value={profile.relationship_status} onValueChange={(v) => setProfile({ ...profile, relationship_status: v })}>
                          <SelectTrigger className="bg-slate-800/80 border-crimson/30 text-white mt-2 focus:border-crimson focus:ring-crimson/50">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-crimson/30">
                            <SelectItem value="single" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Single</SelectItem>
                            <SelectItem value="in_relationship" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">In a Relationship</SelectItem>
                            <SelectItem value="married" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Married</SelectItem>
                            <SelectItem value="its_complicated" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">It's Complicated</SelectItem>
                            <SelectItem value="prefer_not_to_say" className="text-white hover:bg-crimson/20 focus:bg-crimson/20">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Location</Label>
                        <Input
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          placeholder="The Abyss..."
                          maxLength={MAX_LOCATION_LENGTH}
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Website</Label>
                        <Input
                          type="url"
                          value={profile.website}
                          onChange={(e) => setProfile({ ... profile, website: e.target. value })}
                          placeholder="https://..."
                          className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-crimson/20 pb-3">
                      <Music className="inline h-5 w-5 mr-2" />
                      Castle Atmosphere
                    </h3>
                    <div>
                      <Label className="text-crimson font-bold uppercase text-xs">Castle Music URL</Label>
                      <Input
                        type="url"
                        value={profile.castle_music_url}
                        onChange={(e) => setProfile({ ...profile, castle_music_url: e.target. value })}
                        placeholder="https://your-music. mp3"
                        className="bg-slate-800/80 border-crimson/30 text-white placeholder:text-gray-500 mt-2 focus:border-crimson focus:ring-crimson/50"
                      />
                      <p className="text-xs text-gray-400 mt-2">🎵 Auto-plays ambient music when entering your castle</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-crimson/20 pb-3">
                      <Palette className="inline h-5 w-5 mr-2" />
                      Appearance
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-crimson/20 rounded-lg">
                        <div>
                          <Label htmlFor="useGradient" className="text-white font-bold">Use Gradient Background</Label>
                          <p className="text-xs text-gray-400 mt-1">Blend two colors for a mystical effect</p>
                        </div>
                        <input
                          type="checkbox"
                          id="useGradient"
                          checked={profile.use_gradient}
                          onChange={(e) => setProfile({ ...profile, use_gradient: e.target.checked })}
                          className="h-5 w-5 rounded border-crimson/50 accent-crimson cursor-pointer"
                        />
                      </div>

                      {profile.use_gradient ?  (
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="text-crimson font-bold uppercase text-xs">Gradient From</Label>
                            <div className="flex items-center gap-3 mt-2">
                              <Input
                                type="color"
                                value={profile.background_gradient_from}
                                onChange={(e) => setProfile({ ...profile, background_gradient_from: e.target.value })}
                                className="h-12 w-16 cursor-pointer bg-transparent border-crimson/30"
                              />
                              <Input
                                type="text"
                                value={profile. background_gradient_from}
                                readOnly
                                className="bg-slate-800/80 border-crimson/30 text-white text-xs font-mono flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-crimson font-bold uppercase text-xs">Gradient To</Label>
                            <div className="flex items-center gap-3 mt-2">
                              <Input
                                type="color"
                                value={profile. background_gradient_to}
                                onChange={(e) => setProfile({ ...profile, background_gradient_to: e.target.value })}
                                className="h-12 w-16 cursor-pointer bg-transparent border-crimson/30"
                              />
                              <Input
                                type="text"
                                value={profile.background_gradient_to}
                                readOnly
                                className="bg-slate-800/80 border-crimson/30 text-white text-xs font-mono flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-crimson font-bold uppercase text-xs">Background Color</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <Input
                              type="color"
                              value={profile.background_color}
                              onChange={(e) => setProfile({ ...profile, background_color: e.target.value })}
                              className="h-12 w-20 cursor-pointer bg-transparent border-crimson/30"
                            />
                            <Input
                              type="text"
                              value={profile.background_color}
                              readOnly
                              className="bg-slate-800/80 border-crimson/30 text-white text-xs font-mono flex-1"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Text Color</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Input
                            type="color"
                            value={profile.text_color}
                            onChange={(e) => setProfile({ ...profile, text_color: e.target.value })}
                            className="h-12 w-20 cursor-pointer bg-transparent border-crimson/30"
                          />
                          <Input
                            type="text"
                            value={profile. text_color}
                            readOnly
                            className="bg-slate-800/80 border-crimson/30 text-white text-xs font-mono flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-crimson font-bold uppercase text-xs">Font Style</Label>
                        <Select value={profile.font_style} onValueChange={(v) => setProfile({ ...profile, font_style: v })}>
                          <SelectTrigger className="bg-slate-800/80 border-crimson/30 text-white mt-2 focus:border-crimson focus:ring-crimson/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-crimson/30">
                            {FONT_STYLES.map(font => (
                              <SelectItem key={font. value} value={font.value} className="text-white hover:bg-crimson/20 focus: bg-crimson/20">
                                <span className={font.class}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-crimson/20 pb-3">Privacy & Preferences</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-crimson/20 rounded-lg">
                      <div>
                        <Label className="text-white font-bold">Private Profile</Label>
                        <p className="text-xs text-gray-400 mt-1">Only allies can view your castle</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.is_private}
                        onChange={(e) => setProfile({ ...profile, is_private: e.target.checked })}
                        className="h-5 w-5 rounded border-crimson/50 accent-crimson cursor-pointer"
                      />
                    </div>

                    <div className="mt-6">
                      <InterestsSelect
                        value={profile.interests}
                        onChange={(interests) => setProfile({ ... profile, interests })}
                      />
                    </div>

                    <div className="mt-6">
                      <InfernalIdentitySelect
                        value={profile. infernal_identity}
                        onChange={(identity) => setProfile({ ...profile, infernal_identity: identity })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-crimson/20">
                    <Button 
                      onClick={updateProfile} 
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-crimson to-crimson/70 hover:shadow-lg hover:shadow-crimson/50 text-white border border-crimson/50 uppercase font-bold tracking-widest disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "💾 Save Castle"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut} 
                      className="flex-1 border-crimson/30 text-crimson hover:bg-crimson/10 uppercase font-bold tracking-widest"
                    >
                      🚪 Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-crimson/60 text-xs uppercase font-bold">Username</p>
                      <p className="text-white text-lg font-bold mt-2">{profile.username}</p>
                    </div>
                    {profile.infernal_nickname && (
                      <div>
                        <p className="text-crimson/60 text-xs uppercase font-bold">Infernal Nickname</p>
                        <p className="text-white text-lg font-bold mt-2">{profile.infernal_nickname}</p>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <div className="p-4 bg-slate-800/40 border border-crimson/20 rounded-lg">
                      <p className="text-crimson/60 text-xs uppercase font-bold mb-2">Bio</p>
                      <p className="text-white whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {profile.infernal_identity && (
                    <div>
                      <p className="text-crimson/60 text-xs uppercase font-bold">Infernal Identity</p>
                      <p className="text-white text-lg font-bold mt-2">{profile.infernal_identity}</p>
                    </div>
                  )}

                  {profile.interests. length > 0 && (
                    <div>
                      <p className="text-crimson/60 text-xs uppercase font-bold mb-3">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, idx) => (
                          <Badge key={idx} variant="outline" className="border-crimson/50 text-crimson bg-crimson/10">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="avatar">
            <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
              <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  ✨ Advanced Sigil Creator
                </h2>
              </div>
              <div className="p-8">
                <AdvancedSigilCreator 
                  userId={currentUserId}
                  onSave={fetchProfile}
                />
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="dungeon">
          <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
            <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                🏴 {isOwnProfile ? "My Dungeon" : `${profile.username}'s Dungeon`}
              </h2>
            </div>
            <div className="p-12">
              {isOwnProfile ? (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="text-center space-y-3">
                    <p className="text-white text-xl font-bold">🏴 Enter Your Dungeon</p>
                    <p className="text-gray-400">Explore your dark chambers, photo albums, and collections</p>
                  </div>
                  <Button
                    onClick={() => navigate('/my-dungeon')}
                    className="bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white border border-crimson/50 text-lg px-8 py-6"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Open Dungeon
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-6">
                  <Lock className="h-16 w-16 text-crimson/40" />
                  <div className="text-center space-y-3">
                    <p className="text-white text-xl font-bold">🔒 Private Dungeon</p>
                    <p className="text-gray-400">
                      {friendshipStatus === "accepted" 
                        ? "This ally's dungeon is private" 
                        : "Become allies to view their dungeon"}
                    </p>
                  </div>
                  {friendshipStatus === "accepted" && (
                    <Button
                      onClick={() => navigate(`/dungeon/${profile.username}`)}
                      className="bg-gradient-to-r from-crimson to-purple-700 hover:shadow-lg hover:shadow-crimson/50 text-white border border-crimson/50"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      View Dungeon
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          {isOwnProfile && (
            <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
              <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
                <h2 className="text-2xl font-serif font-bold text-white">📖 Inscribe in Book of Shadows</h2>
              </div>
              <div className="p-8">
                <CreatePost onPostCreated={() => {
                  fetchUserPosts();
                  toast.success("Entry inscribed!  🖤");
                }} />
              </div>
            </div>
          )}

          <div className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId}
                  onPostUpdated={fetchUserPosts}
                  onPostDeleted={fetchUserPosts}
                />
              ))
            ) : (
              <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
                <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
                  <h2 className="text-xl font-serif font-bold text-white">📖 Book of Shadows</h2>
                </div>
                <div className="p-12 text-center">
                  <p className="text-gray-400 text-lg">
                    {isOwnProfile ?  "Your grimoire awaits the first incantation..." : "No entries yet"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="inventory">
            <div className="border-2 border-crimson/30 rounded-lg bg-slate-900/40 overflow-hidden">
              <div className="bg-gradient-to-r from-crimson/10 to-purple-900/10 border-b border-crimson/20 px-6 py-4">
                <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                  💎 Inventory
                </h2>
              </div>
              <div className="p-8">
                <InventoryDisplay userId={currentUserId} />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}