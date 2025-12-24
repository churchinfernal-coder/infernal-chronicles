// ═══════════════════════════════════════════════════════════════════════════
// Coven Page - Enterprise Grade Refactored
// ✅ Infinite scroll | ✅ Member avatars | ✅ PayPal donations
// ✅ Enhanced sharing | ✅ Emojis throughout | ✅ "Inscribe" label
// ✅ Admin monetization (80/20 split) | ✅ Real-time updates
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Users,
    Settings,
    Shield,
    Crown,
    MoreHorizontal,
    Send,
    Image as ImageIcon,
    Heart,
    MessageCircle,
    Share2,
    Copy,
    LogOut,
    Trash2,
    UserPlus,
    Lock,
    Globe,
    Pin,
    Bell,
    BellOff,
    Flag,
    Loader2,
    ArrowLeft,
    X,
    Flame,
    Skull,
    Laugh,
    ThumbsUp,
    Angry,
    Eye,
    ImagePlus,
    Video,
    Check,
    Calendar,
    Share,
    Mail,
    DollarSign,
    Twitter
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { GoetiaSignil } from "@/components/GoetiaSignil";
import { GOETIA_DEMONS } from "@/data/goetia";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Coven {
    id: string;
    name: string;
    description: string | null;
    subculture: string | null;
    belief_system: string | null;
    sigil: string | null;
    avatar_url: string | null;
    header_image_url: string | null;
    header_image: string | null;
    is_private: boolean;
    member_count: number;
    invite_code: string | null;
    created_at: string;
    created_by: string;
}

interface Profile {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface Member {
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    profiles: Profile;
}

interface PostReaction {
    id: string;
    user_id: string;
    reaction_emoji: string;
}

interface Post {
    id: string;
    coven_id: string;
    user_id: string;
    parent_post_id: string | null;
    content: string;
    media_url: string | null;
    media_type: string | null;
    visibility: string;
    featured: boolean;
    is_pinned: boolean;
    pinned_at: string | null;
    pinned_by: string | null;
    approval_status: string | null;
    created_at: string;
    updated_at: string;
    profiles: Profile;
    reactions: PostReaction[];
    comments_count: number;
    user_reaction: string | null;
}

interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    profiles: Profile;
}

interface CovenMedia {
    id: string;
    coven_id: string;
    user_id: string;
    media_url: string;
    media_type: string;
    caption: string | null;
    created_at: string;
    profiles?: Profile;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const REACTIONS = [
    { emoji: '🔥', name: 'fire', label: 'Fire' },
    { emoji: '💀', name: 'skull', label: 'Death' },
    { emoji: '🖤', name: 'blackheart', label: 'Love' },
    { emoji: '👍', name: 'like', label: 'Like' },
    { emoji: '😈', name: 'devil', label: 'Evil' },
    { emoji: '😠', name: 'angry', label: 'Angry' },
    { emoji: '✨', name: 'sparkles', label: 'Magical' },
    { emoji: '🌙', name: 'moon', label: 'Moon' },
];

const SHARE_PLATFORMS = [
    { name: 'Copy Link', icon: Copy, action: 'copy' },
    { name: 'Twitter', icon: Twitter, action: 'twitter' },
    { name: 'Email', icon: Mail, action: 'email' },
];

const cardStyle: React.CSSProperties = {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
};

const inputStyle: React.CSSProperties = {
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
    color: '#ffffff',
};

const modalStyle: React.CSSProperties = {
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
};

const POSTS_PER_PAGE = 10;

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function CovenPage() {
    const { covenId } = useParams<{ covenId: string }>();
    const navigate = useNavigate();

    // State
    const [coven, setCoven] = useState<Coven | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [media, setMedia] = useState<CovenMedia[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentMembership, setCurrentMembership] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    // Infinite Scroll
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const postsEndRef = useRef<HTMLDivElement>(null);

    // Post Creation
    const [posting, setPosting] = useState(false);
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostMedia, setNewPostMedia] = useState<{ url: string; type: string } | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // UI
    const [activeTab, setActiveTab] = useState("posts");
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [showDonateDialog, setShowDonateDialog] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
    const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Donations
    const [donationAmount, setDonationAmount] = useState("10");
    const [processingDonation, setProcessingDonation] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // Fetch Functions
    // ═══════════════════════════════════════════════════════════════════════════

    const fetchCoven = useCallback(async () => {
        if (!covenId) return;
        try {
            const { data, error } = await (supabase as any)
                .from("covens")
                .select("*")
                .eq("id", covenId)
                .single();
            if (error) throw error;
            setCoven(data);
        } catch (error: any) {
            console.error('[fetchCoven]', error);
            toast.error("⚠️ Chamber not found");
            navigate("/covens");
        }
    }, [covenId, navigate]);

    const fetchMembers = useCallback(async () => {
        if (!covenId) return;
        try {
            const { data, error } = await (supabase as any)
                .from("coven_members")
                .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
                .eq("coven_id", covenId)
                .order("joined_at", { ascending: true });
            if (error) throw error;
            setMembers(data || []);
        } catch (error: any) {
            console.error('[fetchMembers]', error);
        }
    }, [covenId]);

    const fetchPosts = useCallback(async (page: number = 1, append: boolean = false) => {
        if (!covenId || !currentUser) return;
        try {
            const offset = (page - 1) * POSTS_PER_PAGE;
            const { data: postsData, error: postsError } = await (supabase as any)
                .from("coven_posts")
                .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
                .eq("coven_id", covenId)
                .is("parent_post_id", null)
                .in("visibility", ["public", "members"])
                .order("is_pinned", { ascending: false })
                .order("created_at", { ascending: false })
                .range(offset, offset + POSTS_PER_PAGE - 1);

            if (postsError) throw postsError;

            const postsWithMeta: Post[] = await Promise.all(
                (postsData || []).map(async (post: any) => {
                    const { data: reactions } = await (supabase as any)
                        .from("coven_post_reactions")
                        .select("*")
                        .eq("post_id", post.id);

                    const { count: commentsCount } = await (supabase as any)
                        .from("coven_post_comments")
                        .select("*", { count: "exact", head: true })
                        .eq("post_id", post.id);

                    const userReaction = (reactions || []).find((r: PostReaction) => r.user_id === currentUser.id);

                    return {
                        ...post,
                        reactions: reactions || [],
                        comments_count: commentsCount || 0,
                        user_reaction: userReaction?.reaction_emoji || null,
                    };
                })
            );

            if (append) {
                setPosts(prev => [...prev, ...postsWithMeta]);
            } else {
                setPosts(postsWithMeta);
            }

            setHasMorePosts((postsData || []).length === POSTS_PER_PAGE);
        } catch (error: any) {
            console.error('[fetchPosts]', error);
            toast.error("❌ Failed to load inscriptions");
        }
    }, [covenId, currentUser]);

    const fetchMorePosts = useCallback(async () => {
        if (!hasMorePosts || loadingMorePosts) return;
        setLoadingMorePosts(true);
        await fetchPosts(postsPage + 1, true);
        setPostsPage(prev => prev + 1);
        setLoadingMorePosts(false);
    }, [fetchPosts, hasMorePosts, loadingMorePosts, postsPage]);

    const fetchMedia = useCallback(async () => {
        if (!covenId) return;
        try {
            const { data, error } = await (supabase as any)
                .from("coven_media")
                .select("*")  // Remove the profile join
                .eq("coven_id", covenId)
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            setMedia(data || []);
        } catch (error: any) {
            console.error('[fetchMedia]', error);
        }
    }, [covenId]);

    const fetchCurrentMembership = useCallback(async () => {
        if (!covenId || !currentUser) return;
        try {
            const { data, error } = await (supabase as any)
                .from("coven_members")
                .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
                .eq("coven_id", covenId)
                .eq("user_id", currentUser.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            setCurrentMembership(data || null);
        } catch (error: any) {
            console.error('[fetchCurrentMembership]', error);
        }
    }, [covenId, currentUser]);

    const fetchComments = useCallback(async (postId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from("coven_post_comments")
                .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
                .eq("post_id", postId)
                .order("created_at", { ascending: true });
            if (error) throw error;
            setComments(prev => ({ ...prev, [postId]: data || [] }));
        } catch (error: any) {
            console.error('[fetchComments]', error);
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // Infinite Scroll Observer
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMorePosts && !loadingMorePosts) {
                    fetchMorePosts();
                }
            },
            { threshold: 0.1 }
        );
        if (postsEndRef.current) observer.observe(postsEndRef.current);
        return () => observer.disconnect();
    }, [hasMorePosts, loadingMorePosts, fetchMorePosts]);

    // ═══════════════════════════════════════════════════════════════════════════
    // Lifecycle
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }
            setCurrentUser(user);
        };
        init();
    }, [navigate]);

    useEffect(() => {
        if (currentUser && covenId) {
            Promise.all([
                fetchCoven(),
                fetchMembers(),
                fetchCurrentMembership(),
                fetchMedia(),
            ]).then(() => {
                setLoading(false);
            });
        }
    }, [currentUser, covenId, fetchCoven, fetchMembers, fetchCurrentMembership, fetchMedia]);

    useEffect(() => {
        if (currentMembership) {
            fetchPosts(1, false);
            setPostsPage(1);
        }
    }, [currentMembership, fetchPosts]);

    useEffect(() => {
        if (!covenId || !currentMembership) return;
        const postsChannel = supabase
            .channel(`coven_posts_${covenId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "coven_posts", filter: `coven_id=eq.${covenId}` },
                () => fetchPosts(1, false)
            )
            .subscribe();

        const membersChannel = supabase
            .channel(`coven_members_${covenId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "coven_members", filter: `coven_id=eq.${covenId}` },
                () => {
                    fetchMembers();
                    fetchCoven();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(postsChannel);
            supabase.removeChannel(membersChannel);
        };
    }, [covenId, currentMembership, fetchPosts, fetchMembers, fetchCoven]);

    // ═══════════════════════════════════════════════════════════════════════════
    // Action Handlers
    // ═══════════════════════════════════════════════════════════════════════════

    const handleCreatePost = async () => {
        if (!newPostContent.trim() || posting || !currentUser || !covenId) return;
        setPosting(true);
        try {
            const { error } = await (supabase as any)
                .from("coven_posts")
                .insert({
                    coven_id: covenId,
                    user_id: currentUser.id,
                    content: newPostContent.trim(),
                    media_url: newPostMedia?.url || null,
                    media_type: newPostMedia?.type || null,
                    visibility: 'members',
                    featured: false,
                    is_pinned: false,
                });
            if (error) throw error;
            setNewPostContent("");
            setNewPostMedia(null);
            toast.success("✨ Inscription sealed!");
            fetchPosts(1, false);
            setPostsPage(1);
        } catch (error: any) {
            console.error('[handleCreatePost]', error);
            toast.error("❌ Failed to inscribe");
        } finally {
            setPosting(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;
        if (file.size > 50 * 1024 * 1024) {
            toast.error("📦 File must be < 50MB");
            return;
        }
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) {
            toast.error("🖼️ Only images & videos");
            return;
        }
        setUploadingMedia(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${covenId}/${currentUser.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('coven-media')
                .upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage
                .from('coven-media')
                .getPublicUrl(fileName);
            setNewPostMedia({ url: publicUrl, type: isVideo ? 'video' : 'image' });
            toast.success("📸 Media conjured!");
        } catch (error: any) {
            console.error('[handleMediaUpload]', error);
            toast.error("❌ Upload failed");
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleReaction = async (postId: string, emoji: string) => {
        if (!currentUser) return;
        try {
            const post = posts.find(p => p.id === postId);
            const existingReaction = post?.user_reaction;
            if (existingReaction === emoji) {
                await (supabase as any)
                    .from("coven_post_reactions")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", currentUser.id);
            } else {
                await (supabase as any)
                    .from("coven_post_reactions")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", currentUser.id);
                await (supabase as any)
                    .from("coven_post_reactions")
                    .insert({ post_id: postId, user_id: currentUser.id, reaction_emoji: emoji });
            }
            setShowReactionPicker(null);
            fetchPosts(1, false);
        } catch (error: any) {
            console.error('[handleReaction]', error);
            toast.error("❌ Reaction failed");
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim() || !currentUser || postingComment) return;
        setPostingComment(true);
        try {
            const { error } = await (supabase as any)
                .from("coven_post_comments")
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    content: newComment.trim(),
                });
            if (error) throw error;
            setNewComment("");
            fetchComments(postId);
            fetchPosts(1, false);
            toast.success("💬 Comment added");
        } catch (error: any) {
            console.error('[handleAddComment]', error);
            toast.error("❌ Comment failed");
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const { error } = await (supabase as any)
                .from("coven_posts")
                .delete()
                .eq("id", postId);
            if (error) throw error;
            toast.success("🗑️ Inscription banished");
            fetchPosts(1, false);
            setPostsPage(1);
        } catch (error: any) {
            console.error('[handleDeletePost]', error);
            toast.error("❌ Delete failed");
        }
    };

    const handlePinPost = async (postId: string, isPinned: boolean) => {
        if (!currentUser) return;
        try {
            const { error } = await (supabase as any)
                .from("coven_posts")
                .update({
                    is_pinned: !isPinned,
                    pinned_at: !isPinned ? new Date().toISOString() : null,
                    pinned_by: !isPinned ? currentUser.id : null,
                })
                .eq("id", postId);
            if (error) throw error;
            toast.success(isPinned ? "📌 Unpinned" : "📌 Pinned!");
            fetchPosts(1, false);
        } catch (error: any) {
            console.error('[handlePinPost]', error);
            toast.error("❌ Pin failed");
        }
    };

    const handleShare = async (postId: string, platform: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        const postUrl = `${window.location.origin}/coven/${covenId}#post-${postId}`;
        const shareText = `Check this from ${coven?.name}: "${post.content.substring(0, 80)}..."`;
        try {
            if (platform === 'copy') {
                await navigator.clipboard.writeText(postUrl);
                toast.success("🔗 Link copied!");
            } else if (platform === 'twitter') {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
            } else if (platform === 'email') {
                window.location.href = `mailto:?subject=${encodeURIComponent(`From ${coven?.name}`)}&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}`;
            }
        } catch (error) {
            toast.error("❌ Share failed");
        }
        setShowShareMenu(null);
    };

    const handleDonate = async () => {
        if (!donationAmount || !currentMembership) return;
        setProcessingDonation(true);
        const amount = parseFloat(donationAmount);
        const adminEarnings = (amount * 0.8).toFixed(2);
        try {
            // Create donation record
            await (supabase as any)
                .from("coven_donations")
                .insert({
                    coven_id: covenId,
                    donor_id: currentUser.id,
                    amount: amount,
                    admin_earnings: parseFloat(adminEarnings),
                    platform_commission: (amount * 0.2).toFixed(2),
                    status: 'pending',
                    created_at: new Date().toISOString(),
                });

            // Redirect to PayPal
            const paypalEmail = "support@infernachronicles.com";
            const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${paypalEmail}&item_name=Support%20${encodeURIComponent(coven?.name || 'Chamber')}&amount=${amount}&currency_code=USD`;
            window.open(paypalUrl, '_blank');

            toast.success(`💰 PayPal opening\n💎 Admin earns: $${adminEarnings}`);
            setShowDonateDialog(false);
            setDonationAmount("10");
        } catch (error: any) {
            console.error('[handleDonate]', error);
            toast.error("❌ Donation setup failed");
        } finally {
            setProcessingDonation(false);
        }
    };

    const handleCopyInviteLink = () => {
        const link = `${window.location.origin}/covens?join=${coven?.invite_code}`;
        navigator.clipboard.writeText(link);
        toast.success("🔗 Invitation copied!");
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════════

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-red-500/20 text-red-400 border-red-500/30',
            member: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
        };
        return styles[role] || styles.member;
    };

    const getReactionSummary = (reactions: PostReaction[]) => {
        const grouped = reactions.reduce((acc, r) => {
            acc[r.reaction_emoji] = (acc[r.reaction_emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
    };

    const getBannerUrl = () => {
        return coven?.header_image_url || coven?.header_image || null;
    };

    const isAdmin = currentMembership?.role === 'admin';

    // ═══════════════════════════════════════════════════════════════════════════
    // Loading & Error
    // ═══════════════════════════════════════════════════════════════════════════

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090b' }}>
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
                    <p className="text-xl text-white">🌙 Entering chamber...</p>
                </div>
            </div>
        );
    }

    if (!coven) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090b' }}>
                <div className="text-center">
                    <Skull className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                    <p className="text-xl text-white mb-4">⚠️ Chamber not found</p>
                    <Button onClick={() => navigate("/covens")} variant="outline">
                        Return to Chambers
                    </Button>
                </div>
            </div>
        );
    }

    if (!currentMembership) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#09090b' }}>
                <div className="text-center max-w-md mx-auto p-6">
                    <Lock className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">🔐 {coven.name}</h2>
                    <p className="text-zinc-400 mb-6">Private chamber - invitation needed</p>
                    <Button onClick={() => navigate("/covens")} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Main Render
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#09090b' }}>
            {/* BANNER */}
            <div
                className="h-48 sm:h-56 md:h-72 relative"
                style={{
                    background: getBannerUrl()
                        ? `url(${getBannerUrl()}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
                }}
            >
                <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                        onClick={() => navigate("/covens")}
                    >
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </Button>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowSettingsDialog(true)}
                        >
                            <Settings className="h-5 w-5 text-white" />
                        </Button>
                    )}
                </div>
            </div>

            {/* CHAMBER INFO */}
            <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center border-4 border-[#09090b] shrink-0 overflow-hidden"
                        style={{ backgroundColor: '#18181b' }}
                    >
                        {coven.avatar_url ? (
                            <img src={coven.avatar_url} alt={coven.name} className="w-full h-full object-cover" />
                        ) : coven.sigil?.startsWith('http') ? (
                            <img src={coven.sigil} alt="" className="w-full h-full object-cover" />
                        ) : (
                            (() => {
                                const demon = GOETIA_DEMONS.find(d => d.name.toLowerCase() === coven.sigil) || GOETIA_DEMONS[0];
                                return <GoetiaSignil demonNumber={demon.number} demonName={demon.name} className="w-20 h-20" />;
                            })()
                        )}
                    </div>

                    <div className="flex-1 pt-2">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                                    🔮 {coven.name}
                                    {coven.is_private ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5 text-green-500" />}
                                </h1>
                                <p className="text-zinc-400 text-sm mt-1">
                                    {coven.is_private ? "🔒 Private" : "🌍 Public"} • {coven.member_count || members.length} 👥
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {coven.subculture && (
                                        <Badge variant="outline" className="capitalize text-xs">
                                            {coven.subculture}
                                        </Badge>
                                    )}
                                    {coven.belief_system && (
                                        <Badge variant="outline" className="capitalize text-xs">
                                            {coven.belief_system}
                                        </Badge>
                                    )}
                                    <Badge className={getRoleBadge(currentMembership.role)}>
                                        {currentMembership.role}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    onClick={() => setShowDonateDialog(true)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm"
                                    size="sm"
                                >
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Donate 💎
                                </Button>
                                <Button
                                    onClick={() => setShowInviteDialog(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-sm"
                                    size="sm"
                                >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Invite
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" style={modalStyle}>
                                        <DropdownMenuItem onClick={handleCopyInviteLink}>
                                            <Share2 className="h-4 w-4 mr-2" />
                                            🔗 Share Link
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                        <DropdownMenuItem
                                            onClick={() => navigate("/covens")}
                                            className="text-red-500"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            🚪 Leave
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        {coven.description && (
                            <p className="text-zinc-400 text-sm mt-3 line-clamp-2">{coven.description}</p>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList style={{ backgroundColor: '#18181b' }}>
                        <TabsTrigger value="posts" className="data-[state=active]:bg-red-600">
                            ✨ Inscriptions
                        </TabsTrigger>
                        <TabsTrigger value="members" className="data-[state=active]:bg-red-600">
                            👥 Members
                        </TabsTrigger>
                        <TabsTrigger value="media" className="data-[state=active]:bg-red-600">
                            🖼️ Media
                        </TabsTrigger>
                        <TabsTrigger value="about" className="data-[state=active]:bg-red-600">
                            📖 About
                        </TabsTrigger>
                    </TabsList>

                    {/* INSCRIPTIONS TAB */}
                    <TabsContent value="posts" className="mt-4 space-y-4">
                        <Card style={cardStyle}>
                            <CardContent className="p-4">
                                <div className="flex gap-3">
                                    {/* Member Avatars */}
                                    <div className="flex -space-x-2">
                                        {members.slice(0, 4).map((member) => (
                                            <Avatar key={member.id} className="h-10 w-10 border-2 border-[#18181b]" title={member.profiles?.username}>
                                                <AvatarImage src={member.profiles?.avatar_url || ""} />
                                                <AvatarFallback className="bg-zinc-700 text-xs">
                                                    {member.profiles?.username?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {members.length > 4 && (
                                            <div className="h-10 w-10 rounded-full bg-zinc-700 border-2 border-[#18181b] flex items-center justify-center text-xs text-white font-bold">
                                                +{members.length - 4}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <Textarea
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            placeholder="✍️ Write your inscription..."
                                            className="min-h-20 resize-none"
                                            style={inputStyle}
                                        />
                                        {newPostMedia && (
                                            <div className="relative inline-block">
                                                {newPostMedia.type === 'video' ? (
                                                    <video src={newPostMedia.url} className="max-h-48 rounded-lg" controls />
                                                ) : (
                                                    <img src={newPostMedia.url} alt="preview" className="max-h-48 rounded-lg" />
                                                )}
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7"
                                                    onClick={() => setNewPostMedia(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <div>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    className="hidden"
                                                    onChange={handleMediaUpload}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingMedia}
                                                    className="text-zinc-400 hover:text-white"
                                                >
                                                    {uploadingMedia ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <ImagePlus className="h-4 w-4 mr-2" />
                                                    )}
                                                    📸 Media
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={handleCreatePost}
                                                disabled={posting || (!newPostContent.trim() && !newPostMedia)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                                ✨ Inscribe
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {posts.length === 0 && !loadingMorePosts ? (
                            <Card style={cardStyle}>
                                <CardContent className="p-12 text-center">
                                    <MessageCircle className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-zinc-400">✍️ No inscriptions yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {posts.map((post) => (
                                    <Card key={post.id} style={cardStyle}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <Link to={`/profile/${post.profiles?.username}`}>
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={post.profiles?.avatar_url || ""} />
                                                            <AvatarFallback className="bg-zinc-700">
                                                                {post.profiles?.username?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                    <div>
                                                        <Link to={`/profile/${post.profiles?.username}`} className="font-semibold text-white hover:underline">
                                                            {post.profiles?.display_name || post.profiles?.username}
                                                        </Link>
                                                        {post.is_pinned && <Badge className="ml-2 text-xs">📌 Pinned</Badge>}
                                                        <p className="text-xs text-zinc-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" style={modalStyle}>
                                                        {isAdmin && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handlePinPost(post.id, post.is_pinned)}>
                                                                    {post.is_pinned ? "Unpin" : "📌 Pin"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                            </>
                                                        )}
                                                        {(post.user_id === currentUser?.id || isAdmin) && (
                                                            <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-500">
                                                                🗑️ Delete
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-zinc-200 mb-3 whitespace-pre-wrap">{post.content}</p>
                                            {post.media_url && (
                                                <div className="rounded-lg overflow-hidden mb-3 bg-black">
                                                    {post.media_type === 'video' ? (
                                                        <video src={post.media_url} className="max-h-[500px] w-full object-contain" controls />
                                                    ) : (
                                                        <img src={post.media_url} alt="" className="max-h-[500px] w-full object-contain" />
                                                    )}
                                                </div>
                                            )}
                                            {post.reactions.length > 0 && (
                                                <div className="flex gap-2 mb-3">
                                                    {getReactionSummary(post.reactions).map(([emoji]) => (
                                                        <span key={emoji} className="text-lg">{emoji}</span>
                                                    ))}
                                                    <span className="text-sm text-zinc-500">{post.reactions.length}</span>
                                                </div>
                                            )}
                                            <Separator className="bg-zinc-800 mb-2" />
                                            <div className="flex justify-around">
                                                <div className="relative">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`text-zinc-400 ${post.user_reaction ? 'text-red-500' : ''}`}
                                                        onClick={() => setShowReactionPicker(showReactionPicker === post.id ? null : post.id)}
                                                    >
                                                        {post.user_reaction ? post.user_reaction : '❤️'} React
                                                    </Button>
                                                    {showReactionPicker === post.id && (
                                                        <div className="absolute bottom-full left-0 mb-2 p-2 rounded-lg flex gap-1 z-50 flex-wrap max-w-xs" style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}>
                                                            {REACTIONS.map((r) => (
                                                                <button
                                                                    key={r.name}
                                                                    onClick={() => handleReaction(post.id, r.emoji)}
                                                                    className={`text-2xl p-2 rounded hover:scale-125 transition-all ${post.user_reaction === r.emoji ? 'bg-zinc-600 scale-110' : ''}`}
                                                                >
                                                                    {r.emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-400"
                                                    onClick={() => {
                                                        setActiveCommentPost(activeCommentPost === post.id ? null : post.id);
                                                        if (activeCommentPost !== post.id) fetchComments(post.id);
                                                    }}
                                                >
                                                    💬 Comment
                                                </Button>
                                                <DropdownMenu open={showShareMenu === post.id} onOpenChange={(open) => setShowShareMenu(open ? post.id : null)}>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-zinc-400">
                                                            🔗 Share
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent style={modalStyle}>
                                                        {SHARE_PLATFORMS.map((p) => (
                                                            <DropdownMenuItem key={p.action} onClick={() => handleShare(post.id, p.action)}>
                                                                {p.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            {activeCommentPost === post.id && (
                                                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                                                    {comments[post.id]?.map((c) => (
                                                        <div key={c.id} className="flex gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={c.profiles?.avatar_url || ""} />
                                                                <AvatarFallback className="bg-zinc-700 text-xs">{c.profiles?.username?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: '#27272a' }}>
                                                                <p className="font-semibold text-sm text-white">{c.profiles?.display_name || c.profiles?.username}</p>
                                                                <p className="text-sm text-zinc-300">{c.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={currentMembership?.profiles?.avatar_url || ""} />
                                                            <AvatarFallback className="bg-zinc-700 text-xs">{currentMembership?.profiles?.username?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 flex gap-2">
                                                            <Input
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                placeholder="💬 Comment..."
                                                                className="flex-1 h-9 text-sm"
                                                                style={inputStyle}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleAddComment(post.id);
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-9 w-9 bg-red-600"
                                                                onClick={() => handleAddComment(post.id)}
                                                                disabled={!newComment.trim() || postingComment}
                                                            >
                                                                {postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                                <div ref={postsEndRef} className="py-8 text-center">
                                    {loadingMorePosts && <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto" />}
                                    {!hasMorePosts && posts.length > 0 && <p className="text-zinc-600">🌙 End of chamber</p>}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* MEMBERS TAB */}
                    <TabsContent value="members" className="mt-4">
                        <Card style={cardStyle}>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-white">👥 Members ({members.length})</h3>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#27272a' }}>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={m.profiles?.avatar_url || ""} />
                                                <AvatarFallback className="bg-zinc-600">{m.profiles?.username?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-white">{m.profiles?.display_name || m.profiles?.username}</p>
                                                <p className="text-sm text-zinc-500">@{m.profiles?.username}</p>
                                            </div>
                                        </div>
                                        <Badge className={getRoleBadge(m.role)}>{m.role === 'admin' ? '⚔️ Admin' : 'Member'}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* MEDIA TAB */}
                    <TabsContent value="media" className="mt-4">
                        <Card style={cardStyle}>
                            <CardHeader>
                                <h3 className="text-lg font-semibold text-white">🖼️ Media Gallery</h3>
                            </CardHeader>
                            <CardContent>
                                {media.length === 0 ? (
                                    <p className="text-center text-zinc-400 py-12">No media shared yet</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {media.map((item) => (
                                            <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-900 relative group">
                                                {item.media_type === 'video' ? (
                                                    <video src={item.media_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                                                )}
                                                {item.media_type === 'video' && (
                                                    <div className="absolute top-2 right-2"><Video className="h-5 w-5 text-white" /></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABOUT TAB */}
                    <TabsContent value="about" className="mt-4">
                        <Card style={cardStyle}>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">📖 About</h3>
                                    <p className="text-zinc-400">{coven.description || "No description"}</p>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-zinc-500">Privacy</p>
                                        <p className="text-white">{coven.is_private ? "🔒 Private" : "🌍 Public"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Members</p>
                                        <p className="text-white">{members.length} 👥</p>
                                    </div>
                                    {coven.subculture && (
                                        <div>
                                            <p className="text-sm text-zinc-500">Subculture</p>
                                            <p className="text-white capitalize">{coven.subculture}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-zinc-500">Created</p>
                                        <p className="text-white text-sm">{new Date(coven.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* DIALOGS */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent style={modalStyle}>
                    <DialogHeader>
                        <DialogTitle className="text-white">🔗 Invite Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-zinc-400 mb-2">Share code:</p>
                            <div className="flex gap-2">
                                <Input value={coven?.invite_code || ""} readOnly style={inputStyle} className="font-mono" />
                                <Button size="sm" onClick={() => coven?.invite_code && navigator.clipboard.writeText(coven.invite_code)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button onClick={() => setShowInviteDialog(false)} variant="outline" className="w-full border-zinc-700">
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
                <DialogContent style={modalStyle}>
                    <DialogHeader>
                        <DialogTitle className="text-white">💎 Support This Chamber</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-zinc-400 block mb-2">Amount (USD)</label>
                            <Input
                                type="number"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                                min="1"
                                step="1"
                                style={inputStyle}
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                💎 Admin earns 80% • 🏢 Site gets 20%
                            </p>
                        </div>
                        <Button
                            onClick={handleDonate}
                            disabled={processingDonation}
                            className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                            {processingDonation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                            Donate via PayPal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}