// src/pages/OccultLibraryReader.tsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
}

export default function OccultLibraryReader() {
  const { bookId } = useParams();
  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    // Get book details
    const { data:  bookData } = await supabase
      . from('occult_library_books')
      .select('*')
      .eq('id', bookId)
      .single();

    setBook(bookData);

    // Get chapters
    const { data: chaptersData } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('project_id', bookData.book_project_id)
      .order('chapter_number');

    setChapters(chaptersData || []);
    setLoading(false);
  };

  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* BOOK HEADER */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-red-600 mb-2">{book?. title}</h1>
          <p className="text-gray-400">by {book?.author}</p>
        </div>

        {/* CHAPTER SELECTOR */}
        <div className="flex gap-4 items-center mb-6 bg-gray-900 p-4 rounded border border-red-600/30">
          <Button
            onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
            disabled={currentChapterIndex === 0}
            variant="outline"
            className="border-red-600/50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Select value={currentChapterIndex.toString()} onValueChange={(val) => setCurrentChapterIndex(parseInt(val))}>
            <SelectTrigger className="flex-1 bg-gray-800 border-red-600/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-red-600/50">
              {chapters.map((ch, idx) => (
                <SelectItem key={ch.id} value={idx.toString()}>
                  Chapter {ch.chapter_number}:  {ch.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setCurrentChapterIndex(Math.min(chapters.length - 1, currentChapterIndex + 1))}
            disabled={currentChapterIndex === chapters.length - 1}
            variant="outline"
            className="border-red-600/50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* CHAPTER CONTENT */}
        {currentChapter && (
          <div className="bg-gray-900 p-8 rounded border border-red-600/30">
            <h2 className="text-3xl font-bold mb-6">
              Chapter {currentChapter.chapter_number}: {currentChapter. title}
            </h2>
            <ScrollArea className="h-[600px]">
              <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                {currentChapter.content}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}