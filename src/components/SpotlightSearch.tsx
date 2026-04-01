/**
 * iOS Spotlight Search Component
 * Enhanced search with instant results, categories, and recent searches
 */

import { motion, AnimatePresence } from "motion/react";
import { Search, Clock, TrendingUp, X, ArrowUpRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { haptics } from "../utils/haptics";

export interface SearchResult {
  id: string;
  type: 'receipt' | 'school' | 'student' | 'suggestion';
  title: string;
  subtitle?: string;
  meta_data?: string;
  icon?: any;
  date?: string;
  amount?: string;
}

interface SpotlightSearchProps {
  isVisible: boolean;
  onClose: () => void;
  onSearch: (query: string) => SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
  recentSearches?: string[];
  trendingSearches?: string[];
}

export default function SpotlightSearch({
  isVisible,
  onClose,
  onSearch,
  onSelectResult,
  placeholder = "Search payments, schools, students...",
  recentSearches = [],
  trendingSearches = []
}: SpotlightSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
      setFocusedIndex(0);
    }
  }, [isVisible]);

  useEffect(() => {
    if (query.trim()) {
      const searchResults = onSearch(query);
      setResults(searchResults);
      setFocusedIndex(0);
    } else {
      setResults([]);
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[focusedIndex]) {
      handleSelectResult(results[focusedIndex]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    haptics.light();
    onSelectResult(result);
    onClose();
  };

  const handleRecentSearch = (searchQuery: string) => {
    haptics.light();
    setQuery(searchQuery);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9996] flex flex-col"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 0px)'
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Search Container */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
          className="relative mx-4 mt-4"
        >
          {/* Search Input */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[16px] shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 text-[17px] text-[#003630] placeholder-gray-400 bg-transparent outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results or Suggestions */}
            <div className="max-h-[60vh] overflow-y-auto ios-scroll">
              {query.trim() ? (
                // Search Results
                results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <motion.button
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * index }}
                        onClick={() => handleSelectResult(result)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className={`
                          w-full flex items-start gap-3 px-4 py-3 text-left
                          transition-colors
                          ${focusedIndex === index ? 'bg-gray-50' : 'hover:bg-gray-50'}
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0
                          ${result.type === 'receipt' ? 'bg-[#95e36c]/10 text-[#003630]' : ''}
                          ${result.type === 'school' ? 'bg-blue-50 text-blue-600' : ''}
                          ${result.type === 'student' ? 'bg-purple-50 text-purple-600' : ''}
                          ${result.type === 'suggestion' ? 'bg-gray-100 text-gray-600' : ''}
                        `}>
                          {result.icon ? (
                            <result.icon className="w-5 h-5" />
                          ) : (
                            <Search className="w-5 h-5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-medium text-[#003630] mb-0.5">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-[13px] text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                          {result.meta_data && (
                            <div className="text-[12px] text-gray-400 mt-0.5">
                              {result.meta_data}
                            </div>
                          )}
                        </div>

                        {/* Amount or Arrow */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {result.amount && (
                            <div className="text-[15px] font-semibold text-[#003630]">
                              {result.amount}
                            </div>
                          )}
                          {result.date && (
                            <div className="text-[12px] text-gray-400">
                              {result.date}
                            </div>
                          )}
                          <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <div className="text-[15px] text-gray-500">No results found</div>
                    <div className="text-[13px] text-gray-400 mt-1">
                      Try searching for a different term
                    </div>
                  </div>
                )
              ) : (
                // Recent & Trending Searches
                <div className="py-2">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="px-4 py-2 text-[13px] text-gray-500 uppercase tracking-wider">
                        Recent
                      </div>
                      {recentSearches.map((search, index) => (
                        <motion.button
                          key={`recent-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.02 * index }}
                          onClick={() => handleRecentSearch(search)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="flex-1 text-[15px] text-[#003630]">
                            {search}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Trending Searches */}
                  {trendingSearches.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[13px] text-gray-500 uppercase tracking-wider">
                        Trending
                      </div>
                      {trendingSearches.map((search, index) => (
                        <motion.button
                          key={`trending-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.02 * (index + recentSearches.length) }}
                          onClick={() => handleRecentSearch(search)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#95e36c]/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#003630]" />
                          </div>
                          <span className="flex-1 text-[15px] text-[#003630]">
                            {search}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {recentSearches.length === 0 && trendingSearches.length === 0 && (
                    <div className="py-12 text-center">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <div className="text-[15px] text-gray-500">Start searching</div>
                      <div className="text-[13px] text-gray-400 mt-1">
                        Find payments, schools, and students
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-center text-[13px] text-white/80"
          >
            Press <kbd className="px-2 py-1 bg-white/10 rounded text-[12px]">ESC</kbd> to close
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
