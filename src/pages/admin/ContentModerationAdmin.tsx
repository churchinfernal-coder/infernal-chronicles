import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Flag, Trash2, Eye, EyeOff, RefreshCw, Filter } from "lucide-react";

interface Post {
  id: string;
  content: string;
  user_id: string;
  post_type: string;
  visibility: string;
  flagged_for_review: boolean;
  created_at: string;
  profiles: { username: string } | null;
}

export default function ContentModerationAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterFlagged, setFilterFlagged] = useState("all");
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [filterType, filterVisibility, filterFlagged]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false });

    if (filterType !== "all") query = query.eq("post_type", filterType);
    if (filterVisibility !== "all") query = query.eq("visibility", filterVisibility);
    if (filterFlagged === "flagged") query = query.eq("flagged_for_review", true);
    else if (filterFlagged === "not_flagged") query = query.eq("flagged_for_review", false);

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch posts");
      setLoading(false);
      return;
    }

    let filtered = data || [];
    if (searchUser) {
      filtered = filtered.filter((p) =>
        (p.profiles as any)?.username?.toLowerCase().includes(searchUser.toLowerCase())
      );
    }

    setPosts(filtered as Post[]);
    setLoading(false);
  };

  const handleToggleFlag = async (postId: string, currentFlag: boolean) => {
    const { error } = await supabase
      .from("posts")
      .update({ flagged_for_review: !currentFlag })
      .eq("id", postId);

    if (error) {
      toast.error("Failed to update flag");
      return;
    }

    toast.success(currentFlag ? "Unflagged" : "Flagged");
    fetchPosts();
  };

  const handleToggleVisibility = async (postId: string, currentVis: string) => {
    const newVis = currentVis === "public" ? "private" : "public";
    const { error } = await supabase
      .from("posts")
      .update({ visibility: newVis })
      .eq("id", postId);

    if (error) {
      toast.error("Failed to update visibility");
      return;
    }

    toast.success(`Set to ${newVis}`);
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post permanently?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      toast.error("Failed to delete post");
      return;
    }

    toast.success("Post deleted");
    fetchPosts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Content Moderation
            </CardTitle>
            <CardDescription>
              Flag, hide, or delete posts and confessions
            </CardDescription>
          </div>
          <Button size="sm" onClick={fetchPosts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <Input
            placeholder="Search user..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="whisper">Whisper</SelectItem>
              <SelectItem value="scream">Scream</SelectItem>
              <SelectItem value="incantation">Incantation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFlagged} onValueChange={setFilterFlagged}>
            <SelectTrigger>
              <SelectValue placeholder="Flagged" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="flagged">Flagged Only</SelectItem>
              <SelectItem value="not_flagged">Not Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">
                  {(post.profiles as any)?.username || "Unknown"}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {post.content}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{post.post_type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={post.visibility === "public" ? "default" : "secondary"}>
                      {post.visibility}
                    </Badge>
                    {post.flagged_for_review && (
                      <Badge variant="destructive">
                        <Flag className="h-3 w-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={post.flagged_for_review ? "default" : "outline"}
                      onClick={() => handleToggleFlag(post.id, post.flagged_for_review)}
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(post.id, post.visibility)}
                    >
                      {post.visibility === "public" ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {posts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No posts found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
