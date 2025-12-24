import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Send,
  Video,
  Phone,
  Smile,
  Trash2,
  EyeOff,
  Star,
  Loader2,
  Camera,
  MoreHorizontal,
  Lock,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ChatMediaUpload } from "@/components/ChatMediaUpload";
import { MessageMedia } from "@/components/MessageMedia";
import { ContactsManager } from "@/components/ContactsManager";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { VoiceCallDialog } from "@/components/VoiceCallDialog";
import { VideoCallDialog } from "@/components/VideoCallDialog";
import { CameraCapture } from "@/components/CameraCapture";
import { InfernalReaction } from "@/components/InfernalReaction";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { FloatingSixSixSix } from "@/components/FloatingSixSixSix";
import { ChatAdminPanel } from "@/components/ChatAdminPanel";
import {
  initializeEncryption,
  encryptMessage,
  decryptMessage,
  clearEncryptionKey,
} from "@/lib/chatEncryption";

const REACTIONS = [
  { emoji: "🩸", type: "blood" },
  { emoji: "🕷️", type: "spider" },
  { emoji: "🔥", type: "fire" },
  { emoji: "😈", type: "demon" },
  { emoji: "🪦", type: "grave" },
];

const SPIRIT_TONES = [
  { value: "poetic", label: "Poetic", style: "font-serif italic text-purple-300" },
  { value: "factual", label: "Factual", style: "font-mono text-blue-300" },
  { value: "chaotic", label: "Chaotic", style: "animate-pulse text-red-400" },
  { value: "silent", label: "Silent", style: "opacity-50 text-gray-500" },
  { value: "neutral", label: "Neutral", style: "" },
];

export default function Chat() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, any[]>>({});
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; type: string; preview: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTone, setSelectedTone] = useState("neutral");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState("en");
  const [ringtone, setRingtone] = useState("/ringtones/default. wav");
  const [show666Animation, setShow666Animation] = useState(false);

  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [realtimeReady, setRealtimeReady] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const callAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const avatarInitial = (username?: string) => {
    if (! username || username. trim() === "") return "U";
    return username[0].toUpperCase();
  };

  useEffect(() => {
    try {
      if (callAudioRef.current) {
        callAudioRef.current. pause();
        callAudioRef. current = null;
      }
      callAudioRef.current = new Audio(ringtone);
      callAudioRef.current.loop = true;
    } catch (err) {
      console.warn("Ringtone init failed", err);
      callAudioRef.current = null;
    }
    return () => {
      if (callAudioRef.current) {
        callAudioRef.current.pause();
        callAudioRef.current = null;
      }
    };
  }, [ringtone]);

  useEffect(() => {
    initializeApp();
    return () => {
      if (realtimeChannelRef.current) {
        try {
          supabase.removeChannel(realtimeChannelRef.current);
        } catch {}
      }
      clearEncryptionKey();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation && encryptionKey) {
      fetchMessages();
      subscribeToMessages();
      fetchReactions();
      subscribeToSignals();
    }
    return () => {
      if (realtimeChannelRef.current) {
        try {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        } catch {
          realtimeChannelRef.current = null;
        }
      }
    };
  }, [selectedConversation, encryptionKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const { data: userResult } = await supabase.auth.getUser();
      const user = (userResult as any)?.user ??  null;
      if (!user) {
        toast. error("Please sign in to use chat");
        setIsLoading(false);
        return;
      }
      setCurrentUser(user);

      try {
        const roleRes = await (supabase.from("user_roles") as any)
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        const role = (roleRes as any)?.data ??  null;
        setIsAdmin(!! role);
      } catch (e) {
        console.warn("user_roles check failed", e);
      }

      try {
        const key = await initializeEncryption();
        setEncryptionKey(key);
        setEncryptionReady(true);
      } catch (e) {
        console.error("Encryption init failed", e);
        setEncryptionReady(false);
      }

      await fetchConversations();
    } catch (err: any) {
      console.error("initializeApp error", err);
      toast.error("Failed to initialize chat: " + (err?.message ??  String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: userResult } = await supabase. auth.getUser();
      const user = (userResult as any)?.user ?? null;
      if (!user) return;

      const res = await (supabase.from("conversation_participants") as any)
        . select("conversation_id, conversations(*)")
        .eq("user_id", user.id);

      const rows = (res as any)?.data ?? [];
      const convIds = rows.map((r: any) => r.conversation_id) || [];

      if (convIds.length === 0) {
        setConversations([]);
        return;
      }

      const participantsRes = await (supabase.from("conversation_participants") as any)
        .select("conversation_id, user_id")
        .in("conversation_id", convIds)
        .neq("user_id", user. id);
      const allParticipants = (participantsRes as any)?.data ??  [];

      const otherUserIds = [... new Set(allParticipants.map((p: any) => p.user_id))];

      if (otherUserIds.length === 0) {
        setConversations([]);
        return;
      }

      const profilesRes = await (supabase. from("profiles") as any)
        .select("user_id, username, avatar_url")
        . in("user_id", otherUserIds);

      const profiles = (profilesRes as any)?.data ?? [];

      const convs = (rows || []).map((d: any) => {
        const conv = (d. conversations as any) || {};
        const participant = (allParticipants || []).find(
          (ap: any) => ap.conversation_id === d.conversation_id
        );

        const otherUser = participant
          ? (profiles || []).find((p: any) => p.user_id === participant.user_id)
          : null;

        let displayName = "Unknown User";
        if (otherUser?. username && otherUser. username. trim() !== "") {
          displayName = otherUser.username;
        } else if (otherUser?.user_id) {
          displayName = otherUser.user_id. substring(0, 8) + "...";
        }

        return {
          ...conv,
          id: conv.id ??  d.conversation_id,
          otherUser: otherUser || { user_id: participant?.user_id, username: null, avatar_url: null },
          displayName,
        };
      });

      setConversations(convs);
    } catch (err: any) {
      console.error("fetchConversations error", err);
      toast.error("Failed to load conversations");
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation || !encryptionKey) return;
    setIsLoading(true);
    try {
      const res = await (supabase.from("messages") as any)
        .select("*")
        . eq("conversation_id", selectedConversation)
        .eq("visibility", "visible")
        .order("created_at", { ascending: true });

      const messagesData = (res as any)?.data ?? [];
      const senderIds = Array.from(new Set((messagesData || []).map((m: any) => m.sender_id)));
      const profilesRes = await (supabase.from("profiles") as any)
        .select("user_id, username, avatar_url")
        .in("user_id", senderIds);
      const profilesData = (profilesRes as any)?.data ?? [];

      const decrypted = await Promise.all(
        (messagesData || []).map(async (msg: any) => {
          let content = msg.content;
          let decryptedSuccess = false;
          if (msg.encrypted && content && encryptionKey) {
            try {
              const plain = await decryptMessage(content, encryptionKey);
              content = plain;
              decryptedSuccess = true;
            } catch (err) {
              console. warn("decryptMessage failed for id", msg.id, err);
              content = null;
              decryptedSuccess = false;
            }
          }
          return {
            ... msg,
            content,
            _raw: msg. content,
            decrypted: decryptedSuccess,
            profiles: (profilesData || []).find((p: any) => p. user_id === msg.sender_id) ??  null,
          };
        })
      );

      setMessages(decrypted);
    } catch (err: any) {
      console.error("fetchMessages error", err);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (! selectedConversation) return;
    try {
      if (realtimeChannelRef. current) {
        try {
          supabase.removeChannel(realtimeChannelRef.current);
        } catch {}
        realtimeChannelRef.current = null;
      }

      const channel = supabase
        .channel(`messages:${selectedConversation}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          () => fetchMessages()
        )
        . on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          () => fetchMessages()
        )
        .subscribe((status: any) => {
          setRealtimeReady(status === "SUBSCRIBED");
        });

      realtimeChannelRef.current = channel;
    } catch (err) {
      console.warn("subscribeToMessages failed", err);
    }
  };

  const fetchReactions = async () => {
    if (!selectedConversation) return;
    try {
      const msgsRes = await (supabase.from("messages") as any)
        .select("id")
        .eq("conversation_id", selectedConversation);
      const msgs = (msgsRes as any)?.data ?? [];
      const ids = (msgs || []).map((m: any) => m.id);
      if (ids.length === 0) {
        setMessageReactions({});
        return;
      }
      const reactionsRes = await (supabase.from("message_reactions") as any)
        . select("*")
        .in("message_id", ids);
      const reactions = (reactionsRes as any)?.data ?? [];
      const grouped = (reactions || []).reduce((acc: any, reaction: any) => {
        acc[reaction.message_id] = acc[reaction.message_id] || [];
        acc[reaction. message_id].push(reaction);
        return acc;
      }, {} as Record<string, any[]>);
      setMessageReactions(grouped);
    } catch (err: any) {
      console.error("fetchReactions error", err);
    }
  };

  const sendMessage = async () => {
    if ((! newMessage || newMessage.trim() === "") && !selectedMedia) return;
    if (!selectedConversation || !currentUser || !encryptionKey) {
      toast.error("Cannot send message");
      return;
    }

    setIsSending(true);
    try {
      let content = newMessage. trim();
      let media_url: string | null = null;
      let media_type: string | null = null;

      const encrypted = await encryptMessage(content, encryptionKey);

      if (selectedMedia) {
        const ext = selectedMedia.file.name.split(".").pop();
        const fileName = `${currentUser.id}-${Date.now()}.${ext}`;
        const uploadRes = await (supabase.storage.from("chat-media") as any). upload(
          fileName,
          selectedMedia.file
        );
        if (uploadRes.error) throw uploadRes.error;
        const publicRes = (supabase.storage.from("chat-media") as any).getPublicUrl(fileName);
        media_url = (publicRes as any)?.data?.publicUrl ??  null;
        media_type = selectedMedia.type;
      }

      const insertRes = await (supabase. from("messages") as any). insert({
        conversation_id: selectedConversation,
        sender_id: currentUser.id,
        content: encrypted,
        media_url,
        media_type,
        tone: selectedTone,
        encrypted: true,
        visibility: "visible",
        is_system_message: false,
        admin_injected: false,
      } as any);

      if ((insertRes as any)?.error) throw (insertRes as any). error;

      setNewMessage("");
      setSelectedMedia(null);
    } catch (err: any) {
      console.error("sendMessage error", err);
      toast. error("Failed to send message: " + (err?.message ?? String(err)));
    } finally {
      setIsSending(false);
    }
  };

  const injectAdminMessage = async (content: string) => {
    if (!selectedConversation || !isAdmin || !encryptionKey) return;
    try {
      const encrypted = await encryptMessage(content, encryptionKey);
      const { error } = await (supabase.from("messages") as any). insert({
        conversation_id: selectedConversation,
        sender_id: currentUser.id,
        content: encrypted,
        tone: "system",
        encrypted: true,
        visibility: "visible",
        is_system_message: true,
        admin_injected: true,
      } as any);
      if (error) throw error;
    } catch (err: any) {
      toast.error("Admin inject failed: " + (err?.message ?? String(err)));
    }
  };

  const toggleMessageVisibility = async (messageId: string, currentVisibility: string) => {
    if (!isAdmin) return;
    try {
      const { error } = await (supabase.from("messages") as any)
        .update({ visibility: currentVisibility === "visible" ? "hidden" : "visible" } as any)
        .eq("id", messageId);
      if (error) throw error;
      fetchMessages();
    } catch (err: any) {
      toast.error("Failed to update visibility: " + (err?.message ??  String(err)));
    }
  };

  const toggleFeatured = async (messageId: string, currentFeatured: boolean) => {
    if (!isAdmin) return;
    try {
      const { error } = await (supabase.from("messages") as any)
        .update({ is_featured: ! currentFeatured } as any)
        .eq("id", messageId);
      if (error) throw error;
      fetchMessages();
    } catch (err: any) {
      toast.error("Failed to toggle featured: " + (err?.message ?? String(err)));
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    try {
      const { error } = await (supabase.from("messages") as any). delete().eq("id", messageId);
      if (error) throw error;
      fetchMessages();
    } catch (err: any) {
      toast.error("Failed to delete: " + (err?.message ?? String(err)));
    }
  };

  const addReaction = async (messageId: string, reactionType: string) => {
    if (!currentUser) return;
    try {
      const existing = (messageReactions[messageId] || []).find(
        (r: any) => r.user_id === currentUser.id && r.reaction_type === reactionType
      );
      if (existing) {
        await (supabase. from("message_reactions") as any).delete().eq("id", existing.id);
      } else {
        if (reactionType === "666") {
          setShow666Animation(true);
          setTimeout(() => setShow666Animation(false), 4000);
        }
        await (supabase.from("message_reactions") as any).insert({
          message_id: messageId,
          user_id: currentUser.id,
          reaction_type: reactionType,
        } as any);
      }
      fetchReactions();
    } catch (err: any) {
      toast. error("Reaction failed: " + (err?. message ?? String(err)));
    }
  };

  const startConversationWithContact = async (friendId: string) => {
    try {
      const rpcRes = await (supabase. rpc as any)("start_conversation", { other_user_id: friendId } as any);
      const conversationId = (rpcRes as any)?.data ??  rpcRes;
      if (! conversationId) throw new Error("Failed to create conversation");
      setSelectedConversation(String(conversationId));
      await fetchConversations();
    } catch (err: any) {
      toast.error("Failed to start conversation: " + (err?.message ?? String(err)));
    }
  };

  const archiveConversation = async (convId: string) => {
    try {
      const { error } = await (supabase.from("conversations") as any).update({ archived: true } as any).eq("id", convId);
      if (error) throw error;
      await fetchConversations();
    } catch (err: any) {
      toast.error("Failed to archive: " + (err?.message ?? String(err)));
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      const { error } = await (supabase.from("conversations") as any).delete().eq("id", convId);
      if (error) throw error;
      setSelectedConversation(null);
      await fetchConversations();
    } catch (err: any) {
      toast.error("Failed to delete conversation: " + (err?.message ??  String(err)));
    }
  };

  const blockUser = async (userId: string) => {
    try {
      const { error } = await (supabase.from("blocked_users") as any).insert({
        user_id: currentUser.id,
        blocked_user_id: userId,
      } as any);
      if (error) throw error;
      toast.success("User blocked");
    } catch (err: any) {
      toast.error("Failed to block user: " + (err?. message ?? String(err)));
    }
  };

  const reportUser = async (userId: string, reason = "Inappropriate content") => {
    try {
      const { error } = await (supabase.from("user_reports") as any).insert({
        reporter_id: currentUser.id,
        reported_user_id: userId,
        reason,
      } as any);
      if (error) throw error;
      toast.success("User reported");
    } catch (err: any) {
      toast.error("Failed to report: " + (err?.message ?? String(err)));
    }
  };

  const subscribeToSignals = () => {
    if (! selectedConversation || !currentUser) return;
    try {
      const channel = supabase
        . channel(`webrtc-signals:${selectedConversation}:${currentUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "webrtc_signals",
            filter: `conversation_id=eq.${selectedConversation},to_user_id=eq.${currentUser.id}`,
          },
          async (payload: any) => {
            const signal = payload?. new;
            if (! signal) return;
            await handleIncomingSignal(signal);
          }
        )
        . subscribe();
      realtimeChannelRef.current = channel;
    } catch (err) {
      console.warn("subscribeToSignals failed", err);
    }
  };

  const sendSignal = async (toUserId: string, type: string, body: any) => {
    if (!selectedConversation || !currentUser) return;
    try {
      const payload: any = {
        conversation_id: selectedConversation,
        from_user_id: currentUser. id,
        to_user_id: toUserId,
        type,
      };
      if (type === "offer" || type === "answer") payload.sdp = body;
      if (type === "ice") payload.candidate = body;
      await (supabase.from("webrtc_signals") as any). insert(payload);
    } catch (err) {
      console.error("sendSignal failed", err);
    }
  };

  const createPeerConnection = (onRemoteTrack: (stream: MediaStream) => void) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.onicecandidate = (event) => {
      if (event.candidate && currentUser) {
        const other = getOtherParticipantId();
        if (other) sendSignal(other, "ice", event.candidate);
      }
    };
    const remoteStream = new MediaStream();
    pc.ontrack = (event) => {
      event.streams?.[0]?.getTracks()?.forEach((track) => remoteStream.addTrack(track));
      onRemoteTrack(remoteStream);
    };
    return pc;
  };

  const getOtherParticipantId = () => {
    const conv = conversations.find((c) => c.id === selectedConversation);
    return conv?.otherUser?.user_id ?? null;
  };

  const startCall = async (isVideo: boolean) => {
    if (!selectedConversation || !currentUser) return;
    const other = getOtherParticipantId();
    if (!other) {
      toast.error("No participant found to call");
      return;
    }
    try {
      const constraints = isVideo ?  { audio: true, video: true } : { audio: true, video: false };
      const stream = await navigator.mediaDevices. getUserMedia(constraints);
      localStreamRef.current = stream;
      pcRef.current = createPeerConnection((remoteStream) => {
        remoteStreamRef.current = remoteStream;
      });
      stream.getTracks().forEach((track) => pcRef.current! .addTrack(track, stream));
      const offer = await pcRef.current!.createOffer();
      await pcRef. current!.setLocalDescription(offer);
      await sendSignal(other, "offer", offer. sdp);
      callAudioRef.current?. play(). catch(() => {});
      if (isVideo) setVideoCallOpen(true);
      else setVoiceCallOpen(true);
    } catch (err: any) {
      console.error("startCall error", err);
      toast.error("Failed to start call: " + (err?.message ?? String(err)));
    }
  };

  const handleIncomingSignal = async (signal: any) => {
    if (!signal || !currentUser) return;
    const { from_user_id, type, sdp, candidate } = signal;
    try {
      if (type === "offer") {
        const isVideo = !!sdp && sdp.includes("m=video");
        const constraints = isVideo ? { audio: true, video: true } : { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        pcRef.current = createPeerConnection((remoteStream) => {
          remoteStreamRef.current = remoteStream;
        });
        stream. getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));
        const rtcDesc = { type: "offer", sdp } as any;
        await pcRef.current!.setRemoteDescription(rtcDesc);
        const answer = await pcRef.current! .createAnswer();
        await pcRef.current!.setLocalDescription(answer);
        await sendSignal(from_user_id, "answer", answer.sdp);
        setVoiceCallOpen(true);
        setVideoCallOpen(isVideo);
        callAudioRef.current?.pause();
      } else if (type === "answer") {
        if (pcRef.current && sdp) {
          const rtcDesc = { type: "answer", sdp } as any;
          await pcRef.current. setRemoteDescription(rtcDesc);
          callAudioRef.current?.pause();
        }
      } else if (type === "ice") {
        if (pcRef.current && candidate) {
          try {
            await pcRef.current.addIceCandidate(candidate);
          } catch (iceErr) {
            console.warn("addIceCandidate failed", iceErr);
          }
        }
      }
    } catch (err) {
      console.error("handleIncomingSignal error", err);
    }
  };

  const playRingtone = () => {
    try {
      callAudioRef.current?.play(). catch(() => {});
    } catch {}
  };

  const stopRingtone = () => {
    try {
      if (callAudioRef.current) {
        callAudioRef. current.pause();
        callAudioRef. current.currentTime = 0;
      }
    } catch {}
  };

  const retryDecryptMessage = async (msgId: string) => {
    if (!encryptionKey) return;
    const msg = messages.find((m) => m. id === msgId);
    if (!msg || !msg._raw) return;
    try {
      const plain = await decryptMessage(msg._raw, encryptionKey);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: plain, decrypted: true } : m)));
    } catch (err) {
      console.warn("retryDecrypt failed", err);
      toast.error("Decryption failed");
    }
  };

  const getToneStyle = (tone: string) => {
    const foundTone = SPIRIT_TONES.find((t) => t.value === tone);
    return foundTone?. style ??  "";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedConvData = conversations.find((c) => c.id === selectedConversation);

    return (
    <>
      <FloatingSixSixSix trigger={show666Animation} />
      {show666Animation && <InfernalReaction onComplete={() => setShow666Animation(false)} />}

      {/* ✅ FIXED: Full height container with overflow hidden */}
      <div className="fixed inset-0 flex flex-col bg-background">
        {/* ✅ FIXED: Top nav - always visible, sticky, high z-index */}
        <div className="sticky top-0 z-50 w-full border-b border-border bg-background px-4 py-3 flex items-center justify-between shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/feed")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={encryptionReady ? "default" : "secondary"} className="text-xs">
              {encryptionReady ? "🔒 Encrypted" : "❌"}
            </Badge>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setSettingsOpen(true)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar - conversations */}
          <div className="w-80 border-r border-border flex flex-col">
            <div className="p-3 space-y-3 border-b border-border shrink-0">
              <ContactsManager onSelectContact={startConversationWithContact} />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Spirit Tone</label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full p-2 rounded bg-background border border-border text-sm"
                >
                  {SPIRIT_TONES.map((tone) => (
                    <option key={tone. value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedConversation === conv.id ?  "bg-accent border-primary" : ""
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {conv.otherUser?. avatar_url ? (
                          <AvatarImage src={conv.otherUser.avatar_url} alt={conv.displayName} />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {avatarInitial(conv.otherUser?.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">{conv.displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{conv.otherUser?.username || "unknown"}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">No conversations yet</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right - chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="border-b border-border p-3 flex items-center justify-between shrink-0 bg-background">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 shrink-0">
                      {selectedConvData?.otherUser?.avatar_url ? (
                        <AvatarImage src={selectedConvData.otherUser.avatar_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {avatarInitial(selectedConvData?.otherUser?.username)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">
                        {selectedConvData?.displayName || "Conversation"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{selectedConvData?.otherUser?.username || "unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => startCall(true)}>
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => startCall(false)}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setCameraOpen(true)}>
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-2 w-44" align="end">
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="sm" onClick={() => archiveConversation(selectedConversation)}>
                            Archive
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteConversation(selectedConversation)}>
                            Delete
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const id = selectedConvData?. otherUser?.user_id;
                            if (id) reportUser(id);
                          }}>
                            Report
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            const id = selectedConvData?.otherUser?.user_id;
                            if (id) blockUser(id);
                          }}>
                            Block
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <VoiceCallDialog open={voiceCallOpen} onOpenChange={(o) => { setVoiceCallOpen(o); if (! o) stopRingtone(); }} username={selectedConvData?.otherUser?.username || "User"} />
                <VideoCallDialog open={videoCallOpen} onOpenChange={(o) => { setVideoCallOpen(o); if (!o) stopRingtone(); }} username={selectedConvData?.otherUser?.username || "User"} conversationId={selectedConversation} />
                <CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} />

                {/* Messages area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg: any) => {
                      const isMine = msg.sender_id === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-lg px-4 py-2 ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <div className="text-xs font-semibold mb-1 opacity-70">
                              {msg.profiles?.username || "Unknown"}
                            </div>
                            {msg.decrypted ?  (
                              <div className="text-sm">{msg.content}</div>
                            ) : msg.encrypted ? (
                              <div className="flex items-center gap-2 text-xs">
                                <Lock className="h-3 w-3" />
                                Encrypted
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="border-t border-border p-3 shrink-0">
                  {isAdmin && (
                    <div className="mb-2">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setAdminPanelOpen(! adminPanelOpen)}>
                        ⚠️ Admin Controls {adminPanelOpen ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
                      </Button>
                      {adminPanelOpen && (
                        <ChatAdminPanel onInjectMessage={injectAdminMessage} onDeleteMessage={deleteMessage} onToggleVisibility={toggleMessageVisibility} onToggleFeatured={toggleFeatured} />
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <ChatMediaUpload onMediaSelect={(f, t) => setSelectedMedia({ file: f, type: t, preview: URL.createObjectURL(f) })} onClearMedia={() => setSelectedMedia(null)} selectedMedia={selectedMedia} />
                    <VoiceRecorder onTranscription={setNewMessage} />
                    <Input placeholder="Type a message..." value={newMessage} onChange={(e: any) => setNewMessage(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && sendMessage()} disabled={isSending} />
                    <Button onClick={sendMessage} disabled={isSending || !encryptionKey} size="sm">
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting securely 🔒
              </div>
            )}
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSettingsOpen(false)} />
          <div className="relative bg-background border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm mb-2 block">Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target. value as any)} className="w-full p-2 border rounded">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <Button onClick={() => setSettingsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}