import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Book, Star, Trash2, Plus, Loader2, Edit, Save, X, Upload, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  featured: boolean;
  cover_image_url: string | null;
  published_at: string;
  category: string;
  price_cents: number;
  amazon_url: string | null;
}

export default function FeaturedBooksSliderAdmin() {
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState<FeaturedBook | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFeaturedBooks();
  }, []);

  const fetchFeaturedBooks = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("occult_library_books")
      .select("*")
      .eq("featured", true)
      . order("published_at", { ascending: false });
    
    if (error) {
      console. error('Error:', error);
      toast.error("Failed to load featured books");
      setLoading(false);
      return;
    }
    setFeaturedBooks(data || []);
    setLoading(false);
  };

  const createNewBook = () => {
    const newBook: FeaturedBook = {
      id: "",
      title: "New Featured Book",
      author: "Author Name",
      description: "Book description",
      cover_image_url: null,
      price_cents: 2999,
      category: "Occult",
      featured: true,
      amazon_url: null,
      published_at: new Date().toISOString(),
    };
    setEditingBook(newBook);
    setCreating(true);
    setDialogOpen(true);
  };

  const saveBook = async () => {
    if (!editingBook) return;

    try {
      if (creating) {
        const { id, ...bookWithoutId } = editingBook;
        const { data, error } = await (supabase as any)
          .from("occult_library_books")
          .insert([bookWithoutId])
          .select()
          .single();

        if (error) throw error;
        toast.success("Book created and added to featured slider!");
        fetchFeaturedBooks();
      } else {
        const { error } = await (supabase as any)
          .from("occult_library_books")
          .update(editingBook)
          .eq("id", editingBook.id);

        if (error) throw error;
        toast.success("Book updated successfully");
        fetchFeaturedBooks();
      }

      setEditingBook(null);
      setCreating(false);
      setDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const removeFeatured = async (id: string) => {
    if (! confirm("Remove this book from featured slider?")) return;

    const { error } = await (supabase as any)
      .from("occult_library_books")
      .update({ featured: false })
      . eq("id", id);
    
    if (error) {
      toast.error("Failed to remove");
      return;
    }
    toast.success("Removed from featured slider");
    fetchFeaturedBooks();
  };

  const uploadCover = async (file: File) => {
    if (!editingBook?. id && creating) {
      toast.error("Please save the book first before uploading cover");
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `covers/${editingBook! .id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        . getPublicUrl(filePath);

      const { error: updateError } = await (supabase as any)
        .from("occult_library_books")
        .update({ cover_image_url: publicUrl })
        .eq("id", editingBook! .id);

      if (updateError) throw updateError;

      setEditingBook({ ... editingBook!, cover_image_url: publicUrl });
      toast.success("Cover uploaded!");
      fetchFeaturedBooks();
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-crimson/30">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-crimson" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-crimson/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Star className="h-5 w-5 text-crimson fill-crimson" /> 
                Featured Books Slider Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage which books appear in the featured slider on the homepage
              </p>
            </div>
            
            <Button onClick={createNewBook} className="bg-crimson hover:bg-crimson/80">
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {featuredBooks.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Star className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <div className="text-muted-foreground">No featured books yet</div>
              <Button onClick={createNewBook} variant="outline" className="border-crimson/40">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Featured Book
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{featuredBooks.length} Featured Books</Badge>
                <p className="text-xs text-muted-foreground">Books are ordered by publish date</p>
              </div>
              
              {featuredBooks.map((book, idx) => (
                <div 
                  key={book.id} 
                  className="flex items-center gap-4 p-3 border border-crimson/20 rounded-lg hover:border-crimson/40 transition-all"
                >
                  {book.cover_image_url ?  (
                    <img 
                      src={book.cover_image_url} 
                      alt={book.title} 
                      className="h-20 w-16 object-cover rounded border border-crimson/20" 
                    />
                  ) : (
                    <div className="h-20 w-16 bg-crimson/10 rounded border border-crimson/20 flex items-center justify-center">
                      <Book className="h-6 w-6 text-crimson/40" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-crimson line-clamp-1">{book.title}</div>
                    <div className="text-sm text-muted-foreground">by {book.author}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{book.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        ${(book.price_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="shrink-0">Position: {idx + 1}</Badge>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingBook(book);
                      setCreating(false);
                      setDialogOpen(true);
                    }}
                    className="shrink-0"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => removeFeatured(book. id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT/CREATE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
<DialogContent 
  className="max-w-3xl max-h-[90vh] overflow-y-auto border-crimson/30" 
  style={{ backgroundColor: '#0a0a0a' }}
>
    <DialogHeader>
      <DialogTitle className="text-xl text-crimson">
        {creating ? "Add New Featured Book" : `Edit: ${editingBook?.title}`}
      </DialogTitle>
      <DialogDescription>
        {creating ? "Create a new book and add it to the featured slider" : "Update book information"}
      </DialogDescription>
    </DialogHeader>

    {editingBook && (
      <div className="space-y-4 py-4">
        {/* Cover Upload */}
        {! creating && editingBook.id && (
          <div className="border-2 border-dashed border-crimson/30 rounded-lg p-4 bg-muted/30">
            <Label className="text-base flex items-center gap-2 mb-3 font-semibold">
              <ImageIcon className="h-4 w-4 text-crimson" />
              Book Cover
            </Label>
            
            <div className="flex items-center gap-4">
              {editingBook.cover_image_url ?  (
                <img 
                  src={editingBook.cover_image_url} 
                  alt="Cover" 
                  className="w-24 h-32 object-cover rounded border-2 border-crimson/30"
                />
              ) : (
                <div className="w-24 h-32 bg-muted rounded border-2 border-dashed border-crimson/30 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCover(file);
                  }}
                  disabled={uploadingCover}
                  className="cursor-pointer bg-background"
                />
                {uploadingCover && (
                  <p className="text-xs text-crimson mt-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading... 
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {creating && (
          <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded text-sm text-blue-300">
            💡 <strong>Tip:</strong> Save the book first, then you can upload the cover image
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="font-semibold">Title *</Label>
            <Input
              id="title"
              value={editingBook.title}
              onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
              className="bg-background"
            />
          </div>
          <div>
            <Label htmlFor="author" className="font-semibold">Author *</Label>
            <Input
              id="author"
              value={editingBook.author}
              onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
              className="bg-background"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="font-semibold">Description</Label>
          <Textarea
            id="description"
            value={editingBook.description}
            onChange={(e) => setEditingBook({ ... editingBook, description: e. target.value })}
            rows={4}
            className="bg-background"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category" className="font-semibold">Category</Label>
            <Input
              id="category"
              value={editingBook.category}
              onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
              className="bg-background"
            />
          </div>
          <div>
            <Label htmlFor="price" className="font-semibold">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={(editingBook.price_cents / 100).toFixed(2)}
              onChange={(e) => setEditingBook({ 
                ...editingBook, 
                price_cents: Math.round(parseFloat(e.target. value) * 100) 
              })}
              className="bg-background"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="amazon" className="font-semibold">Amazon Buy Link (Optional)</Label>
          <Input
            id="amazon"
            value={editingBook.amazon_url || ""}
            onChange={(e) => setEditingBook({ ... editingBook, amazon_url: e.target.value })}
            placeholder="https://amazon.com/..."
            className="bg-background"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button onClick={saveBook} className="flex-1 bg-crimson hover:bg-crimson/80">
            <Save className="h-4 w-4 mr-2" />
            {creating ? "Create Book" : "Save Changes"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setEditingBook(null);
              setCreating(false);
              setDialogOpen(false);
            }}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </>
  );
}
