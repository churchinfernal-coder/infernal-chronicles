import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const REACTION_EMOJIS = ["🔥", "💀", "🖤", "⚡", "👹", "🩸", "😈", "⚰️"];

interface PostReactionsProps {
  postId: string;
  currentUserId: string;
}

export function PostReactions({ postId, currentUserId }: PostReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, any[]>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReactions();
    subscribeToReactions();
  }, [postId]);

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from("coven_post_reactions")
      .select("*, profiles(username, avatar_url)")
      .eq("post_id", postId);

    if (error) {
      console.error("Error fetching reactions:", error);
      return;
    }

    const grouped: Record<string, any[]> = {};
    const userReacts = new Set<string>();

    data?.forEach((reaction) => {
      if (!grouped[reaction.reaction_emoji]) {
        grouped[reaction.reaction_emoji] = [];
      }
      grouped[reaction.reaction_emoji].push(reaction);
      if (reaction.user_id === currentUserId) {
        userReacts.add(reaction.reaction_emoji);
      }
    });

    setReactions(grouped);
    setUserReactions(userReacts);
  };

  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`post-reactions-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coven_post_reactions",
          filter: `post_id=eq.${postId}`,
        },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleReaction = async (emoji: string) => {
    if (userReactions.has(emoji)) {
      const { error } = await supabase
        .from("coven_post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .eq("reaction_emoji", emoji);

      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("coven_post_reactions")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          reaction_emoji: emoji,
        });

      if (error) toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactions[emoji]?.length || 0;
        const isActive = userReactions.has(emoji);

        return (
          <Button
            key={emoji}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => toggleReaction(emoji)}
            className={`text-lg px-3 py-1 h-auto ${
              isActive ? "bg-primary text-primary-foreground" : ""
            }`}
          >
            {emoji}
            {count > 0 && <span className="ml-1.5 text-xs font-semibold">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
