'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import { X, Wallet, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { wallets, select, connecting, connected } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null);

  // Close modal when connected
  useEffect(() => {
    if (connected) {
      onClose();
    }
  }, [connected, onClose]);

  // Group wallets by readiness
  const installedWallets = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed
  );
  const loadableWallets = wallets.filter(
    (w) => w.readyState === WalletReadyState.Loadable
  );
  const notDetectedWallets = wallets.filter(
    (w) => w.readyState === WalletReadyState.NotDetected
  );

  const handleSelect = async (walletName: WalletName) => {
    setSelectedWallet(walletName);
    select(walletName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Connect Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Installed Wallets */}
          {installedWallets.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Installed
              </p>
              <div className="space-y-2">
                {installedWallets.map((wallet) => (
                  <WalletButton
                    key={wallet.adapter.name}
                    wallet={wallet}
                    onClick={() => handleSelect(wallet.adapter.name)}
                    isConnecting={connecting && selectedWallet === wallet.adapter.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loadable Wallets */}
          {loadableWallets.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Available
              </p>
              <div className="space-y-2">
                {loadableWallets.map((wallet) => (
                  <WalletButton
                    key={wallet.adapter.name}
                    wallet={wallet}
                    onClick={() => handleSelect(wallet.adapter.name)}
                    isConnecting={connecting && selectedWallet === wallet.adapter.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Not Detected Wallets */}
          {notDetectedWallets.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Not Installed
              </p>
              <div className="space-y-2">
                {notDetectedWallets.slice(0, 3).map((wallet) => (
                  <a
                    key={wallet.adapter.name}
                    href={wallet.adapter.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                  >
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      className="h-8 w-8 rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{wallet.adapter.name}</p>
                      <p className="text-xs text-muted-foreground">Get wallet</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No wallets available */}
          {wallets.length === 0 && (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No Solana wallets found. Please install a wallet extension.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-secondary/30">
          <p className="text-xs text-muted-foreground text-center">
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

interface WalletButtonProps {
  wallet: {
    adapter: {
      name: WalletName;
      icon: string;
    };
  };
  onClick: () => void;
  isConnecting: boolean;
}

function WalletButton({ wallet, onClick, isConnecting }: WalletButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
        'hover:bg-secondary/50 hover:border-primary/50',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <img
        src={wallet.adapter.icon}
        alt={wallet.adapter.name}
        className="h-8 w-8 rounded-lg"
      />
      <span className="flex-1 text-left font-medium">{wallet.adapter.name}</span>
      {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
    </button>
  );
}

export default WalletModal;
