import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Book, Crown, Search, Star, ExternalLink, Download, Loader2 } from "lucide-react";
import FeaturedBooksSlider from "@/components/FeaturedBooksSlider";
import { useLanguage } from "@/contexts/LanguageContext";

interface OccultBook {
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
  published_at: string;
  pdf_url: string | null;
  amazon_url: string | null;
}

interface Subscription {
  id: string;
  subscription_type: string;
  status: string;
  expires_at: string | null;
}

export default function OccultLibrary() {
  const [books, setBooks] = useState<OccultBook[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<OccultBook[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    checkAccess();
    fetchBooks();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to access the Occult Library");
      navigate("/auth");
      return;
    }

    const { data: subs } = await (supabase as any)
      .from("occult_subscriptions")
      . select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    
    setSubscription(subs);

    const { data: userPurchases } = await (supabase as any)
      . from("book_purchases")
      .select("book_id")
      .eq("user_id", user.id);
    
    if (userPurchases) {
      setPurchases(userPurchases.map((p: any) => p.book_id));
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    
    const { data: allBooks, error } = await (supabase as any)
      .from("occult_library_books")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      toast.error("Failed to load books");
      setLoading(false);
      return;
    }

    setBooks(allBooks || []);
    setFeaturedBooks(allBooks?.filter((b: any) => b.featured) || []);
    setLoading(false);
  };

  const hasAccess = (bookId: string) => {
    return subscription?.status === "active" || purchases.includes(bookId);
  };

  const startCheckout = async () => {
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase. auth.getSession();
      if (!session) {
        toast.error("Please login to subscribe");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase. functions.invoke('create-checkout', {
        body: { price_id: 'price_1SJNd5C79jfp0Sqd5OFRxSMI' }
      });

      if (error) throw error;
      if (data?. url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error("Checkout failed: " + error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const downloadPDF = async (book: OccultBook) => {
    if (!book.pdf_url) {
      toast.error("PDF not available for this book");
      return;
    }

    if (! hasAccess(book.id)) {
      toast.error("Subscribe or purchase to download");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('book-pdfs')
        .download(book.pdf_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error: any) {
      toast.error("Download failed: " + error.message);
    }
  };

  const filteredBooks = books.filter(book => 
    book. title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book. author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.description?. toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BookCard = ({ book }: { book: OccultBook }) => {
    const canRead = hasAccess(book.id);

    const handleDownloadPDF = async () => {
      if (!book.pdf_url) return;
      
      const { data, error } = await supabase.storage
        .from('book-pdfs')
        .download(book.pdf_url);

      if (error) {
        toast.error("Failed to download PDF");
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <Card className="bg-background/50 border-crimson/20 hover:border-crimson/40 transition-all flex flex-col">
        <CardHeader>
          {book.cover_image_url && (
            <img 
              src={book.cover_image_url} 
              alt={book.title}
              className="w-full h-40 md:h-48 object-cover rounded-md mb-4"
            />
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-crimson flex items-center gap-2 text-base md:text-lg">
                <span className="line-clamp-2">{book.title}</span>
                {book.featured && <Star className="h-4 w-4 fill-crimson shrink-0" />}
              </CardTitle>
              <CardDescription className="text-foreground/70 text-sm">
                by {book.author}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 flex-1">
          <p className="text-xs md:text-sm text-foreground/80 line-clamp-3">
            {book.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {book.tags?.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3 md:gap-4 text-xs text-muted-foreground">
            <span>{book.total_chapters} {t("library. chapters")}</span>
            <span>{(book.total_words / 1000).toFixed(1)}k words</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {canRead ?  (
            <>
              <Button 
                onClick={() => navigate(`/occult-library/read/${book.id}`)}
                className="w-full bg-crimson hover:bg-crimson/80 text-sm"
                size="sm"
              >
                <Book className="mr-2 h-4 w-4" />
                {t("library.read")}
              </Button>
              {book.pdf_url && (
                <Button 
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="w-full border-crimson/40 text-sm"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("library.download")}
                </Button>
              )}
            </>
          ) : (
            <div className="w-full space-y-2">
              <div className="p-2 md:p-3 bg-crimson/10 border border-crimson/30 rounded-lg space-y-2">
                <p className="text-xs text-center text-foreground/80">
                  {t("library.subscribeInfo")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <span className="text-base md:text-lg font-bold text-crimson">
                    {t("library.pricePerMonth")}
                  </span>
                  <Badge variant="outline" className="text-xs border-crimson/40">
                    {t("library.unlimitedReading")}
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={startCheckout}
                disabled={checkingOut}
                className="w-full bg-crimson hover:bg-crimson/80 text-sm"
                size="sm"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("library.processing")}
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    {t("library.subscribeButton")}
                  </>
                )}
              </Button>
            </div>
          )}
          {book.amazon_url && (
            <Button 
              onClick={() => window. open(book.amazon_url!, '_blank')}
              variant="secondary"
              className="w-full text-sm"
              size="sm"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Buy on Amazon
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 md:ml-64 lg:ml-72">
        <div className="max-w-7xl mx-auto py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-foreground/10 rounded w-1/2 md:w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3]. map(i => (
                <div key={i} className="h-80 md:h-96 bg-foreground/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-4 md:ml-64 lg:ml-72">
      <FeaturedBooksSlider />
      
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-crimson flex items-center gap-2 md:gap-3">
                <Book className="h-6 w-6 md:h-8 md:w-8" />
                {t("library.title")}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                {t("library.subtitle")}
              </p>
            </div>
            {subscription?. status === "active" && (
              <Badge variant="outline" className="border-crimson text-crimson">
                <Crown className="mr-1 h-3 w-3" />
                Subscribed
              </Badge>
            )}
          </div>

          {/* Subscription CTA */}
          {! subscription && (
            <Card className="bg-crimson/10 border-crimson/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-crimson text-lg md:text-xl">Unlock Full Access</CardTitle>
                <CardDescription className="text-sm">
                  Subscribe for $29. 99/month for unlimited access to all books in the Occult Library
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  onClick={startCheckout}
                  disabled={checkingOut}
                  className="bg-crimson hover:bg-crimson/80 w-full sm:w-auto"
                  size="sm"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Subscribe Now - $29.99/mo
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("library.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-crimson/20"
            />
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-background/50 w-full grid grid-cols-2 sm:grid-cols-3">
            <TabsTrigger value="all" className="text-sm">All Books</TabsTrigger>
            <TabsTrigger value="featured" className="text-sm">Featured</TabsTrigger>
            {subscription && <TabsTrigger value="reading" className="text-sm">Continue Reading</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">{t("library.noBooks")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featuredBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </TabsContent>

          {subscription && (
            <TabsContent value="reading" className="mt-6">
              <div className="text-center py-12">
                <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">Start reading to see your progress here</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}