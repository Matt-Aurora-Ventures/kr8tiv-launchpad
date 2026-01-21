'use client';

import Link from 'next/link';
import { Twitter, MessageCircle, Github, ExternalLink } from 'lucide-react';

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/kr8tiv', icon: Twitter },
  { name: 'Discord', href: 'https://discord.gg/kr8tiv', icon: MessageCircle },
  { name: 'GitHub', href: 'https://github.com/kr8tiv', icon: Github },
];

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Launch Token', href: '/launch' },
      { name: 'Explore Tokens', href: '/explore' },
      { name: 'Staking', href: '/staking' },
      { name: 'Leaderboard', href: '/leaderboard' },
      { name: 'Governance', href: '/governance' },
    ],
  },
  {
    title: 'Earn',
    links: [
      { name: 'Referrals', href: '/referrals' },
      { name: 'Achievements', href: '/achievements' },
      { name: 'Airdrop', href: '/airdrop' },
      { name: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Documentation', href: '/docs', external: true },
      { name: 'API Reference', href: '/api-docs', external: true },
      { name: 'Blog', href: '/blog', external: true },
      { name: 'Support', href: 'https://discord.gg/kr8tiv', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Disclaimer', href: '/disclaimer' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-white font-bold">K</span>
              </div>
              <span className="text-xl font-bold gradient-text">KR8TIV</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Launch your token on Solana with fully customizable tokenomics.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <social.icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold mb-3">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {link.name}
                      {'external' in link && link.external && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} KR8TIV. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built on{' '}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Solana
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
