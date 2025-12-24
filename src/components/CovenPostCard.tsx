import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PostReactions } from "./PostReactions";
import { PostComments } from "./PostComments";

interface CovenPostCardProps {
  post: any;
  currentUserId: string;
  isCovenAdmin: boolean;
  isSuperAdmin: boolean;
  onReply: (postId: string) => void;
  onUpdate: () => void;
}

export function CovenPostCard({
  post,
  currentUserId,
  isCovenAdmin,
  isSuperAdmin,
  onReply,
  onUpdate,
}: CovenPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = post.user_id === currentUserId || isCovenAdmin || isSuperAdmin;
  const canDelete = post.user_id === currentUserId || isCovenAdmin || isSuperAdmin;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("coven_posts")
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post updated");
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;

    try {
      const { error } = await supabase
        .from("coven_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post deleted");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleFeatured = async () => {
    try {
      const { error } = await supabase
        .from("coven_posts")
        .update({ featured: !post.featured })
        .eq("id", post.id);

      if (error) throw error;

      toast.success(post.featured ? "Unfeatured" : "Featured");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all ${
        post.featured
          ? "border-primary bg-primary/5 coven-ambient-glow"
          : "border-border bg-card hover:border-primary/30"
      } ${post.parent_post_id ? "ml-8 mt-2" : "mb-4"}`}
    >
      {post.featured && (
        <div className="absolute -top-2 -right-2">
          <Star className="h-6 w-6 text-primary fill-primary" />
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.profiles?.avatar_url} />
          <AvatarFallback>{post.profiles?.username?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground">
              {post.profiles?.username || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            <Badge variant="outline" className="text-xs">
              {post.visibility}
            </Badge>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={isSubmitting}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(post.content);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-foreground whitespace-pre-wrap mb-3">{post.content}</p>

              {post.media_url && (
                <div className="mb-3">
                  {post.media_type === "video" ? (
                    <video
                      src={post.media_url}
                      controls
                      autoPlay
                      loop
                      muted
                      className="max-h-96 rounded-lg w-full bg-black"
                    />
                  ) : (
                    <img
                      src={post.media_url}
                      alt="Post media"
                      className="max-h-96 rounded-lg w-auto"
                    />
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}

                  {(isCovenAdmin || isSuperAdmin) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleFeatured}
                      className="text-xs"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {post.featured ? "Unfeature" : "Feature"}
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDelete}
                      className="text-xs text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>

                <PostReactions postId={post.id} currentUserId={currentUserId} />
                <PostComments postId={post.id} currentUserId={currentUserId} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
