import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
}

interface BookData {
  id: string;
  title: string;
  author: string;
  description: string;
}

const WORDS_PER_PAGE = 750;

function splitIntoPages(content: string, wordsPerPage = WORDS_PER_PAGE): string[] {
  const words = content.trim().split(/\s+/);
  if (!words.length) return [""];
  const pages: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(" "));
  }
  return pages;
}

export default function OccultLibraryReader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const loadBook = async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data, error: fnError } = await supabase.functions.invoke("get-book-content", {
      body: { bookId },
    });

    if (fnError) {
      const message = (fnError as any)?.context?.error || fnError.message || "Failed to load book";
      setError(message);
      setLoading(false);
      return;
    }

    if (!data?.book) {
      setError(data?.error || "Book not found");
      setLoading(false);
      return;
    }

    const loadedChapters = (data.chapters || []) as Chapter[];
    setBook(data.book as BookData);
    setChapters(loadedChapters);

    if (data.readingHistory?.chapter_number) {
      const idx = loadedChapters.findIndex((c) => c.chapter_number === data.readingHistory.chapter_number);
      if (idx >= 0) setCurrentChapterIndex(idx);
    }

    setLoading(false);
  };

  const currentChapter = chapters[currentChapterIndex];

  const currentChapterPages = useMemo(
    () => (currentChapter ? splitIntoPages(currentChapter.content) : []),
    [currentChapter]
  );

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [currentChapterIndex]);

  useEffect(() => {
    if (!userId || !bookId || !currentChapter || !chapters.length) return;

    const pagesPerChapter = chapters.map((ch) => splitIntoPages(ch.content).length);
    const totalPages = pagesPerChapter.reduce((sum, n) => sum + n, 0);
    const pagesBeforeCurrent = pagesPerChapter.slice(0, currentChapterIndex).reduce((sum, n) => sum + n, 0);
    const absolutePage = pagesBeforeCurrent + currentPageIndex + 1;
    const progress = Math.max(1, Math.min(100, Math.round((absolutePage / Math.max(totalPages, 1)) * 100)));

    const timeout = setTimeout(async () => {
      await (supabase as any)
        .from("reading_history")
        .upsert(
          {
            user_id: userId,
            book_id: bookId,
            chapter_number: currentChapter.chapter_number,
            progress_percentage: progress,
          },
          { onConflict: "user_id,book_id" }
        );
    }, 300);

    return () => clearTimeout(timeout);
  }, [userId, bookId, currentChapter, currentChapterIndex, currentPageIndex, chapters]);

  const goPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((p) => p - 1);
      return;
    }
    if (currentChapterIndex > 0) {
      const prevChapterIdx = currentChapterIndex - 1;
      const prevPages = splitIntoPages(chapters[prevChapterIdx].content);
      setCurrentChapterIndex(prevChapterIdx);
      setCurrentPageIndex(Math.max(prevPages.length - 1, 0));
    }
  };

  const goNextPage = () => {
    if (currentPageIndex < currentChapterPages.length - 1) {
      setCurrentPageIndex((p) => p + 1);
      return;
    }
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex((c) => c + 1);
      setCurrentPageIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <Lock className="h-10 w-10 mx-auto text-red-500" />
          <p className="text-gray-300">{error}</p>
          <Button onClick={() => navigate("/occult-library")} className="bg-red-600 hover:bg-red-700">
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  if (!book || !currentChapter) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">No published chapter content available yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-red-600">{book.title}</h1>
            <p className="text-gray-400">by {book.author}</p>
          </div>
          <Badge variant="outline" className="border-red-600/60 text-red-300 w-fit">
            Chapter {currentChapter.chapter_number} • Page {currentPageIndex + 1}/{currentChapterPages.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-4">
          <aside className="bg-gray-900 border border-red-600/30 rounded p-3">
            <p className="text-sm font-semibold mb-2">Table of Contents</p>
            <Select
              value={currentChapterIndex.toString()}
              onValueChange={(val) => setCurrentChapterIndex(parseInt(val, 10))}
            >
              <SelectTrigger className="bg-gray-800 border-red-600/50 mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-red-600/50">
                {chapters.map((ch, idx) => (
                  <SelectItem key={ch.id} value={idx.toString()}>
                    {ch.chapter_number}. {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ScrollArea className="h-[220px] lg:h-[520px] pr-2">
              <div className="space-y-1">
                {chapters.map((ch, idx) => (
                  <Button
                    key={ch.id}
                    variant={idx === currentChapterIndex ? "default" : "ghost"}
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => setCurrentChapterIndex(idx)}
                  >
                    <span className="truncate text-xs md:text-sm">
                      {ch.chapter_number}. {ch.title}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <main className="bg-gray-900 border border-red-600/30 rounded p-4 md:p-8">
            <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
              Chapter {currentChapter.chapter_number}: {currentChapter.title}
            </h2>

            <ScrollArea className="h-[55vh] md:h-[62vh]">
              <div className="font-serif text-base md:text-lg leading-relaxed whitespace-pre-wrap pr-2">
                {currentChapterPages[currentPageIndex] || ""}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between gap-3 pt-4">
              <Button
                onClick={goPreviousPage}
                disabled={currentChapterIndex === 0 && currentPageIndex === 0}
                variant="outline"
                className="border-red-600/50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Page
              </Button>

              <p className="text-xs md:text-sm text-gray-400 text-center">
                {currentChapterPages.length ? `Page ${currentPageIndex + 1} of ${currentChapterPages.length}` : ""}
              </p>

              <Button
                onClick={goNextPage}
                disabled={
                  currentChapterIndex === chapters.length - 1 &&
                  currentPageIndex >= currentChapterPages.length - 1
                }
                variant="outline"
                className="border-red-600/50"
              >
                Next Page
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}