'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Send,
  MessageCircle,
  Heart,
  Flag,
  MoreHorizontal,
  Trash2,
  Pin,
  AlertCircle,
} from 'lucide-react';
import { cn, formatRelativeTime, shortenAddress } from '@/lib/utils';
import { Button, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface Comment {
  id: string;
  author: string;
  authorName?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isPinned: boolean;
  replies?: Comment[];
}

interface TokenCommentsProps {
  tokenMint: string;
  className?: string;
}

export function TokenComments({ tokenMint, className }: TokenCommentsProps) {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mock data - replace with API call
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setComments([
        {
          id: '1',
          author: '9WzDX...4Kp2',
          authorName: 'whale.sol',
          content: 'This project is going to moon! Dev is based and the roadmap looks solid.',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          likes: 42,
          isLiked: false,
          isPinned: true,
        },
        {
          id: '2',
          author: '7AbCd...8Xyz',
          content: 'Just aped in. LFG! 🚀',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          likes: 15,
          isLiked: true,
          isPinned: false,
        },
        {
          id: '3',
          author: '5EfGh...2Jkl',
          content: 'Chart looks healthy. Nice support at current levels.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          likes: 8,
          isLiked: false,
          isPinned: false,
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, [tokenMint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      toast({ type: 'error', title: 'Error', message: 'Please connect your wallet to comment' });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const comment: Comment = {
        id: crypto.randomUUID(),
        author: shortenAddress(publicKey.toString()),
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isPinned: false,
      };

      setComments((prev) => [comment, ...prev]);
      setNewComment('');

      toast({ type: 'success', title: 'Posted', message: 'Your comment has been posted' });
    } catch {
      toast({ type: 'error', title: 'Error', message: 'Failed to post comment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = (commentId: string) => {
    if (!connected) {
      toast({ type: 'error', title: 'Error', message: 'Please connect your wallet to like' });
      return;
    }

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  const handleReport = (commentId: string) => {
    toast({ type: 'info', title: 'Reported', message: 'Thank you for your report. We will review this comment.' });
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast({ type: 'success', title: 'Deleted', message: 'Comment deleted' });
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (sortBy === 'top') return b.likes - a.likes;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className={cn('card', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'top')}
          className="input text-sm py-1 px-2"
        >
          <option value="newest">Newest</option>
          <option value="top">Top</option>
        </select>
      </div>

      {/* Comment Form */}
      {connected ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={500}
            showCount
            className="min-h-[80px]"
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? (
                'Posting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-secondary/50 rounded-lg text-center mb-6">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-secondary rounded" />
                  <div className="h-4 w-full bg-secondary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={publicKey?.toString()}
              onLike={() => handleLike(comment.id)}
              onReport={() => handleReport(comment.id)}
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Single Comment Item
interface CommentItemProps {
  comment: Comment;
  currentUser?: string;
  onLike: () => void;
  onReport: () => void;
  onDelete: () => void;
}

function CommentItem({ comment, currentUser, onLike, onReport, onDelete }: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUser && comment.author.includes(currentUser.slice(0, 4));

  return (
    <div
      className={cn(
        'p-3 rounded-lg transition-colors',
        comment.isPinned ? 'bg-primary/5 border border-primary/20' : 'hover:bg-secondary/50'
      )}
    >
      {comment.isPinned && (
        <div className="flex items-center gap-1 text-xs text-primary mb-2">
          <Pin className="h-3 w-3" />
          Pinned
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {comment.author.slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.authorName || comment.author}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(new Date(comment.timestamp))}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onLike}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors',
                comment.isLiked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-red-500'
              )}
            >
              <Heart className={cn('h-4 w-4', comment.isLiked && 'fill-current')} />
              {comment.likes}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 py-1 w-32 bg-background border border-border rounded-lg shadow-lg z-20">
                    {isOwner && (
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-sm text-left hover:bg-secondary flex items-center gap-2 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onReport();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-secondary flex items-center gap-2"
                    >
                      <Flag className="h-3 w-3" />
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenComments;
