'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock, Star, Loader2 } from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  logo?: string;
}

interface TokenSearchProps {
  onSelect?: (token: SearchResult) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const STORAGE_KEY = 'kr8tiv_recent_searches';
const MAX_RECENT = 5;

export function TokenSearch({
  onSelect,
  placeholder = 'Search tokens...',
  className,
  autoFocus = false,
}: TokenSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((token: SearchResult) => {
    const updated = [token, ...recentSearches.filter(t => t.mint !== token.mint)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  // Search API
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchTokens = async () => {
      setIsLoading(true);
      try {
        // In production, this would call the API
        // For now, simulate search results
        await new Promise(r => setTimeout(r, 200));

        // Simulated results
        const mockResults: SearchResult[] = [
          {
            mint: 'mock1',
            symbol: debouncedQuery.toUpperCase(),
            name: `${debouncedQuery} Token`,
            price: Math.random() * 0.001,
            priceChange24h: (Math.random() - 0.5) * 20,
            marketCap: Math.random() * 1000000,
          },
        ];

        setResults(mockResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchTokens();
  }, [debouncedQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? results : recentSearches;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (token: SearchResult) => {
    saveRecentSearch(token);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onSelect) {
      onSelect(token);
    } else {
      router.push(`/tokens/${token.mint}`);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const displayItems = query ? results : recentSearches;
  const showDropdown = isOpen && (displayItems.length > 0 || isLoading);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="input pl-10 pr-10 w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Header */}
              {!query && recentSearches.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Results */}
              <div className="max-h-64 overflow-y-auto">
                {displayItems.map((token, index) => {
                  const isPositive = token.priceChange24h >= 0;

                  return (
                    <button
                      key={token.mint}
                      onClick={() => handleSelect(token)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 hover:bg-secondary transition-colors',
                        selectedIndex === index && 'bg-secondary'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">${formatNumber(token.price, 6)}</p>
                        <p className={cn(
                          'text-xs flex items-center justify-end gap-1',
                          isPositive ? 'text-green-500' : 'text-red-500'
                        )}>
                          <TrendingUp className={cn('h-3 w-3', !isPositive && 'rotate-180')} />
                          {isPositive ? '+' : ''}{formatNumber(token.priceChange24h, 2)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              {query && results.length > 0 && (
                <div className="border-t px-3 py-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Press Enter to select or click a result
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TokenSearch;
