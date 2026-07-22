/**
 * BookLibrary Component
 * Purpose: Display catalog of available e-books
 * Features: Search, filter by category, purchase flow, reading list
 * Mobile-first responsive design
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthFetch } from '../hooks/useSecurityGate';
import { EbookReader } from './EbookReader';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url?: string;
  category: string;
  price?: number;
  owned: boolean;
}

export function BookLibrary() {
  const { user } = useAuth();
  const { fetchWithAuth } = useAuthFetch();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await fetchWithAuth('/api/books?owned=true');
        if (response.ok) {
          const data = await response.json();
          setBooks(data.books);

          // Extract unique categories
          const cats = [...new Set(data.books.map((b: Book) => b.category))];
          setCategories(['all', ...cats]);
        }
      } catch (err) {
        console.error('Failed to load books:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBooks();
    }
  }, [user, fetchWithAuth]);

  // Filter books based on search and category
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedBook) {
    return (
      <>
        <button
          onClick={() => setSelectedBook(null)}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
        >
          ← Back to Library
        </button>
        <EbookReader bookId={selectedBook} />
      </>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Occult Library
          </h1>
          <p className="text-purple-300">Your collection of forbidden knowledge</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search books or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading library...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onSelect={() => setSelectedBook(book.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'No books match your search'
                : 'No books in your library'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Book Card Component
 */
function BookCard({ book, onSelect }: { book: Book; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer group rounded-lg overflow-hidden bg-gray-900 border border-gray-800 hover:border-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/20"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-purple-600 to-purple-900 overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-4xl mb-2">📖</div>
              <p className="text-xs text-purple-200 line-clamp-3">{book.title}</p>
            </div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">
            Read Now
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-2 mb-1 group-hover:text-purple-300">
          {book.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-1 mb-2">{book.author}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
            {book.category}
          </span>
          {book.owned && <span className="text-green-400">✓ Owned</span>}
        </div>
      </div>
    </div>
  );
}
