import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Book, Plus, Trash2, Upload, Loader2, Star, DollarSign, Image as ImageIcon, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string | null;
  price_cents: number;
  category: string;
  tags: string[] | null;
  total_chapters: number;
  total_words: number;
  excerpt: string | null;
  featured: boolean;
  pdf_url: string | null;
  amazon_url: string | null;
  published_at: string;
}

export default function OccultLibraryAdmin() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("occult_library_books")
      .select("*")
      . order("published_at", { ascending: false });

    if (error) {
      toast.error("Failed to load books");
      return;
    }

    setBooks(data || []);
    setLoading(false);
  };

  const createNewBook = () => {
    const newBook: LibraryBook = {
      id: "",
      title: "New Book",
      author: "Author Name",
      description: "Book description",
      cover_image_url: null,
      price_cents: 2999,
      category: "Occult",
      tags: [],
      total_chapters: 0,
      total_words: 0,
      excerpt: null,
      featured: false,
      pdf_url: null,
      amazon_url: null,
      published_at: new Date().toISOString(),
    };
    setEditingBook(newBook);
    setCreating(true);
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
        toast.success("Book created successfully!  You can now upload cover and PDF.");
        setBooks([data, ...books]);
        setEditingBook(data); // Keep editing to allow uploads
        setCreating(false);
      } else {
        const { error } = await (supabase as any)
          .from("occult_library_books")
          .update(editingBook)
          .eq("id", editingBook.id);

        if (error) throw error;
        toast.success("Book updated successfully");
        setBooks(books.map(b => b.id === editingBook.id ? editingBook : b));
      }
    } catch (error: any) {
      toast.error("Failed to save book: " + error.message);
    }
  };

  const deleteBook = async (id: string) => {
    if (! confirm("Are you sure you want to delete this book?")) return;

    try {
      const { error } = await (supabase as any)
        .from("occult_library_books")
        . delete()
        .eq("id", id);

      if (error) throw error;
      toast. success("Book deleted");
      setBooks(books.filter(b => b.id !== id));
      if (editingBook?. id === id) {
        setEditingBook(null);
        setCreating(false);
      }
    } catch (error: any) {
      toast.error("Failed to delete book: " + error.message);
    }
  };

  const uploadCover = async (file: File) => {
    if (!editingBook?. id) {
      toast.error("Please save the book first before uploading cover");
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `covers/${editingBook.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        . upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      const { error: updateError } = await (supabase as any)
        .from("occult_library_books")
        . update({ cover_image_url: publicUrl })
        .eq("id", editingBook.id);

      if (updateError) throw updateError;

      const updatedBook = { ...editingBook, cover_image_url: publicUrl };
      setEditingBook(updatedBook);
      setBooks(books.map(b => b.id === editingBook.id ? updatedBook : b));
      toast.success("Cover uploaded successfully!");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadPDF = async (file: File) => {
    if (!editingBook?.id) {
      toast.error("Please save the book first before uploading PDF");
      return;
    }

    setUploadingPDF(true);
    try {
      const filePath = `books/${editingBook.id}. pdf`;

      const { error: uploadError } = await supabase.storage
        .from('book-pdfs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await (supabase as any)
        . from("occult_library_books")
        .update({ pdf_url: filePath })
        .eq("id", editingBook.id);

      if (updateError) throw updateError;

      const updatedBook = { ...editingBook, pdf_url: filePath };
      setEditingBook(updatedBook);
      setBooks(books. map(b => b.id === editingBook.id ? updatedBook : b));
      toast. success("PDF uploaded successfully!");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-crimson flex items-center gap-2">
            <Book className="h-6 w-6 md:h-8 md:w-8" />
            Occult Library Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage all books in the occult library • Total: {books.length}
          </p>
        </div>
        <Button onClick={createNewBook} className="bg-crimson hover:bg-crimson/80 w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add New Book
        </Button>
      </div>

      {editingBook && (
        <Card className="border-crimson/30 shadow-lg">
          <CardHeader className="bg-crimson/5">
            <CardTitle className="text-lg md:text-xl">
              {creating ? "Create New Book" : `Edit: ${editingBook.title}`}
            </CardTitle>
            <CardDescription>
              {creating 
                ? "Fill in details and save first, then upload cover and PDF" 
                : "Update book information and manage uploads"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={editingBook.author}
                  onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  placeholder="Enter author name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={editingBook.description}
                onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                rows={3}
                placeholder="Enter book description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={editingBook. category}
                  onChange={(e) => setEditingBook({ ... editingBook, category: e. target.value })}
                  placeholder="e.g., Occult, Ritual"
                />
              </div>
              <div>
                <Label htmlFor="price" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Price (USD) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={(editingBook.price_cents / 100).toFixed(2)}
                  onChange={(e) => setEditingBook({ 
                    ...editingBook, 
                    price_cents: Math.round(parseFloat(e. target.value) * 100) 
                  })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Featured
                </Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    checked={editingBook.featured}
                    onCheckedChange={(checked) => setEditingBook({ ... editingBook, featured: checked })}
                  />
                  <span className="text-sm">{editingBook.featured ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="amazon">Amazon Buy Link</Label>
              <Input
                id="amazon"
                value={editingBook.amazon_url || ""}
                onChange={(e) => setEditingBook({ ...editingBook, amazon_url: e.target.value })}
                placeholder="https://amazon.com/..."
              />
            </div>

            {/* UPLOAD SECTION - PROMINENT */}
            {! creating && editingBook. id && (
              <div className="border-2 border-dashed border-crimson/30 rounded-lg p-6 bg-crimson/5 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-crimson" />
                  Book Assets
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cover Upload */}
                  <div className="space-y-3">
                    <Label className="text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-crimson" />
                      Book Cover Image
                    </Label>
                    
                    {editingBook.cover_image_url ?  (
                      <div className="relative group">
                        <img 
                          src={editingBook.cover_image_url} 
                          alt="Book cover" 
                          className="w-full h-48 object-cover rounded border-2 border-crimson/30"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                          <Label 
                            htmlFor="cover-upload" 
                            className="cursor-pointer text-white flex items-center gap-2 bg-crimson px-4 py-2 rounded"
                          >
                            <Upload className="h-4 w-4" />
                            Change Cover
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <Label 
                        htmlFor="cover-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-crimson/30 rounded cursor-pointer hover:border-crimson/60 transition-all bg-background"
                      >
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload cover</span>
                        <span className="text-xs text-muted-foreground">(JPG, PNG, WEBP)</span>
                      </Label>
                    )}
                    
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e. target.files?.[0];
                        if (file) uploadCover(file);
                      }}
                      disabled={uploadingCover}
                      className="hidden"
                    />
                    
                    {uploadingCover && (
                      <div className="flex items-center gap-2 text-sm text-crimson">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading cover...
                      </div>
                    )}
                  </div>

                  {/* PDF Upload */}
                  <div className="space-y-3">
                    <Label className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-crimson" />
                      Book PDF File
                    </Label>
                    
                    {editingBook.pdf_url ? (
                      <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-crimson/30 rounded bg-background p-4">
                        <FileText className="h-16 w-16 text-green-500 mb-3" />
                        <Badge variant="outline" className="mb-3 text-green-600 border-green-600">
                          ✓ PDF Uploaded
                        </Badge>
                        <Label 
                          htmlFor="pdf-upload"
                          className="cursor-pointer text-sm text-crimson hover:underline"
                        >
                          Replace PDF
                        </Label>
                      </div>
                    ) : (
                      <Label 
                        htmlFor="pdf-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-crimson/30 rounded cursor-pointer hover:border-crimson/60 transition-all bg-background"
                      >
                        <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload PDF</span>
                        <span className="text-xs text-muted-foreground">(PDF files only)</span>
                      </Label>
                    )}
                    
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPDF(file);
                      }}
                      disabled={uploadingPDF}
                      className="hidden"
                    />
                    
                    {uploadingPDF && (
                      <div className="flex items-center gap-2 text-sm text-crimson">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading PDF...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {creating && (
              <div className="p-4 bg-muted/50 rounded border border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                  💡 <strong>Tip:</strong> Save the book first, then you can upload cover image and PDF file
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t">
              <Button 
                onClick={saveBook} 
                className="bg-crimson hover:bg-crimson/80 flex-1"
                disabled={!editingBook.title || !editingBook.author}
              >
                {creating ? "Create Book" : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingBook(null);
                  setCreating(false);
                }}
                className="flex-1"
              >
                {creating ? "Cancel" : "Close"}
              </Button>
              {! creating && editingBook.id && (
                <Button
                  variant="destructive"
                  onClick={() => deleteBook(editingBook. id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Book
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Books Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Books</CardTitle>
          <CardDescription>Click on any book to edit</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {books. map((book) => (
                <Card 
                  key={book.id} 
                  className="border-crimson/20 hover:border-crimson/60 transition-all cursor-pointer group"
                  onClick={() => {
                    setEditingBook(book);
                    setCreating(false);
                  }}
                >
                  <CardContent className="p-4 space-y-3">
                    {book.cover_image_url ?  (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-full h-48 object-cover rounded border border-crimson/20 group-hover:border-crimson/40 transition-all"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded border border-dashed border-crimson/20 flex items-center justify-center">
                        <Book className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-crimson line-clamp-2 flex items-center gap-2 group-hover:text-crimson/80">
                        {book.title}
                        {book.featured && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 shrink-0" />}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">by {book.author}</p>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="outline" className="flex-1 justify-center">{book.category}</Badge>
                      <Badge variant="outline" className="flex-1 justify-center text-green-600">
                        ${(book.price_cents / 100).toFixed(2)}
                      </Badge>
                    </div>

                    {book.pdf_url && (
                      <Badge variant="secondary" className="w-full justify-center text-xs">
                        📄 PDF Available
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {books.length === 0 && (
              <div className="text-center py-12">
                <Book className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No books yet</p>
                <p className="text-sm text-muted-foreground">Click "Add New Book" to get started</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
