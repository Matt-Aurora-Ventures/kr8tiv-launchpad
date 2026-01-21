'use client';

import { useState } from 'react';
import {
  Twitter,
  Send,
  Link2,
  Check,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'compact';
}

export function ShareButtons({
  url,
  title,
  description = '',
  hashtags = ['KR8TIV', 'Solana', 'Crypto'],
  className,
  variant = 'horizontal',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const hashtagString = hashtags.join(',');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtagString}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    discord: `https://discord.com/channels/@me?content=${encodedUrl}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const buttons = [
    {
      name: 'Twitter',
      icon: Twitter,
      href: shareLinks.twitter,
      color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
    },
    {
      name: 'Telegram',
      icon: Send,
      href: shareLinks.telegram,
      color: 'hover:bg-[#0088cc]/10 hover:text-[#0088cc]',
    },
    {
      name: 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: copyLink,
      color: copied ? 'text-green-500' : 'hover:bg-secondary',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={handleNativeShare}
          className="btn btn-secondary"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-lg shadow-lg p-2 z-50">
            {buttons.map((button) => (
              <button
                key={button.name}
                onClick={() => {
                  if (button.onClick) {
                    button.onClick();
                  } else if (button.href) {
                    window.open(button.href, '_blank', 'width=600,height=400');
                  }
                  setShowDropdown(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  button.color
                )}
              >
                <button.icon className="h-4 w-4" />
                <span>{button.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2',
        variant === 'vertical' && 'flex-col',
        className
      )}
    >
      {buttons.map((button) => (
        button.href ? (
          <a
            key={button.name}
            href={button.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-center gap-2 p-2 rounded-lg transition-colors',
              button.color
            )}
            title={button.name}
          >
            <button.icon className="h-5 w-5" />
            {variant === 'vertical' && <span className="text-sm">{button.name}</span>}
          </a>
        ) : (
          <button
            key={button.name}
            onClick={button.onClick}
            className={cn(
              'flex items-center justify-center gap-2 p-2 rounded-lg transition-colors',
              button.color
            )}
            title={button.name}
          >
            <button.icon className="h-5 w-5" />
            {variant === 'vertical' && <span className="text-sm">{button.name}</span>}
          </button>
        )
      ))}
    </div>
  );
}

export default ShareButtons;
