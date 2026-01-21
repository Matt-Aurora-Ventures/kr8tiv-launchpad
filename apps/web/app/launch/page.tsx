'use client';

import { Rocket } from 'lucide-react';
import { LaunchWizard } from '@/components/launch/LaunchWizard';

export default function LaunchPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
          <Rocket className="h-4 w-4" />
          Token Creator
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Launch Your Token
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Create a new token on Solana with customizable tokenomics.
          All tax features are opt-in - configure only what you need.
        </p>
      </div>

      {/* Launch Wizard */}
      <LaunchWizard />
    </div>
  );
}
