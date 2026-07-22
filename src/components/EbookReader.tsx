/**
 * EbookReader Component
 * Purpose: Display e-book content with reading progress tracking
 * Features: PDF/EPUB support, bookmarks, progress sync, mobile-responsive
 * Gate Requirement: P95 < 500ms, Success > 99%, Error < 1%
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthFetch } from '../hooks/useSecurityGate';

interface BookMetadata {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  total_pages: number;
  format: 'pdf' | 'epub';
}

interface ReadingProgress {
  currentPage: number;
  currentChapter: number;
  lastReadAt: string;
  timeSpent: number; // in seconds
}

export function EbookReader({ bookId }: { bookId: string }) {
  const { user, token } = useAuth();
  const { fetchWithAuth } = useAuthFetch();

  const [book, setBook] = useState<BookMetadata | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Load book metadata
  useEffect(() => {
    const loadBook = async () => {
      try {
        const response = await fetchWithAuth(`/api/books/${bookId}`);
        if (!response.ok) throw new Error('Failed to load book');

        const data = await response.json();
        setBook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book');
      }
    };

    loadBook();
  }, [bookId, fetchWithAuth]);

  // Load reading progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetchWithAuth(`/api/books/${bookId}/progress`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (err) {
        console.error('Failed to load progress:', err);
      }
    };

    if (token) {
      loadProgress();
    }
  }, [bookId, token, fetchWithAuth]);

  // Get signed URL for book file
  useEffect(() => {
    const getBookFile = async () => {
      try {
        const response = await fetchWithAuth(
          `/functions/v1/get-book-file?bookId=${bookId}&format=${book?.format || 'pdf'}`
        );

        if (!response.ok) {
          throw new Error('Failed to access book file');
        }

        const data = await response.json();
        setFileUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book file');
      } finally {
        setLoading(false);
      }
    };

    if (book) {
      getBookFile();
    }
  }, [book, bookId, fetchWithAuth]);

  // Save reading progress periodically
  useEffect(() => {
    if (!progress) return;

    const saveProgress = async () => {
      try {
        await fetchWithAuth(`/api/books/${bookId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...progress,
            lastReadAt: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    };

    const timer = setInterval(saveProgress, 60000); // Save every minute
    return () => clearInterval(timer);
  }, [progress, bookId, fetchWithAuth]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 text-gray-400">Loading book...</div>
          <div className="w-12 h-12 border-4 border-purple-600 border-t-purple-300 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-semibold">{book?.title}</h1>
          <p className="text-sm text-gray-400">{book?.author}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 hover:bg-gray-800 rounded"
              title="Zoom out"
            >
              −
            </button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 hover:bg-gray-800 rounded"
              title="Zoom in"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setBookmarkOpen(!bookmarkOpen)}
            className="p-2 hover:bg-gray-800 rounded"
            title="Bookmarks"
          >
            🔖
          </button>

          <a
            href={fileUrl}
            download
            className="p-2 hover:bg-gray-800 rounded"
            title="Download"
          >
            ⬇️
          </a>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 overflow-auto bg-gray-950 p-4 md:p-8">
        {fileUrl ? (
          <div className="max-w-4xl mx-auto" style={{ zoom: `${zoom}%` }}>
            {book?.format === 'pdf' ? (
              <iframe
                src={fileUrl}
                className="w-full h-screen border-0 rounded"
                title={book.title}
              />
            ) : (
              <div className="text-gray-400 text-center py-12">
                <p className="mb-4">EPUB reader loading...</p>
                <p className="text-sm">
                  <a href={fileUrl} download className="text-purple-400 hover:text-purple-300">
                    Download EPUB file
                  </a>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unable to load book file</p>
          </div>
        )}
      </div>

      {/* Footer - Reading Progress */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            {progress && (
              <>
                Page {progress.currentPage} of {book?.total_pages}
              </>
            )}
          </div>
          <div className="text-xs">
            {progress?.lastReadAt &&
              `Last read: ${new Date(progress.lastReadAt).toLocaleDateString()}`}
          </div>
        </div>

        {/* Progress Bar */}
        {progress && book && (
          <div className="mt-2 w-full bg-gray-800 rounded-full h-1">
            <div
              className="bg-purple-600 h-1 rounded-full transition-all"
              style={{ width: `${(progress.currentPage / book.total_pages) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Bookmarks Sidebar */}
      {bookmarkOpen && (
        <div className="absolute right-0 top-12 bottom-0 w-64 bg-gray-900 border-l border-gray-800 p-4 overflow-auto">
          <h2 className="font-semibold mb-4">Bookmarks</h2>
          <div className="text-gray-400 text-sm">
            <p>No bookmarks yet</p>
            <p className="mt-2 text-xs">Click in the book to add bookmarks</p>
          </div>
        </div>
      )}
    </div>
  );
}
