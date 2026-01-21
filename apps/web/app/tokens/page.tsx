'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { useTokens } from '@/hooks/useTokens';
import { TokenCard } from '@/components/shared/TokenCard';
import { cn } from '@/lib/utils';

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'volume24h-desc', label: 'Highest Volume' },
  { value: 'marketCap-desc', label: 'Highest Market Cap' },
];

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('createdAt-desc');

  const [sortBy, order] = sortValue.split('-') as [
    'createdAt' | 'volume24h' | 'marketCap',
    'asc' | 'desc'
  ];

  const { tokens, isLoading, error, page, totalPages, hasMore, nextPage, prevPage, total } =
    useTokens({
      sortBy,
      order,
    });

  // Filter tokens by search query (client-side for now)
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Tokens</h1>
        <p className="text-muted-foreground">
          Discover tokens launched on KR8TIV Launchpad
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or symbol..."
            className="input pl-10"
          />
        </div>

        {/* Sort */}
        <Select.Root value={sortValue} onValueChange={setSortValue}>
          <Select.Trigger className="btn-outline w-full sm:w-[200px] justify-between">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <Select.Value />
            </span>
            <Select.Icon>
              <ChevronRight className="h-4 w-4 rotate-90" />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="overflow-hidden bg-card border border-border rounded-lg shadow-lg z-50">
              <Select.Viewport className="p-1">
                {sortOptions.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex items-center px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-accent outline-none data-[highlighted]:bg-accent"
                  >
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Showing {filteredTokens.length} of {total} tokens
            </>
          )}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-outline">
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTokens.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'No tokens found matching your search.'
              : 'No tokens have been launched yet.'}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn-outline">
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Token Grid */}
      {!isLoading && !error && filteredTokens.length > 0 && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredTokens.map((token) => (
              <TokenCard key={token.mint} token={token} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevPage}
                disabled={page === 1}
                className={cn('btn-outline', page === 1 && 'opacity-50 cursor-not-allowed')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={nextPage}
                disabled={!hasMore}
                className={cn('btn-outline', !hasMore && 'opacity-50 cursor-not-allowed')}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
