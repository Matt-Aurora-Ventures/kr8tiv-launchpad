/**
 * Tests for wallet components
 * WalletMultiButton, WalletModal, WalletAvatar, ConnectionStatus
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock wallet adapter hooks
const mockPublicKey = {
  toBase58: () => 'TestWallet123456789',
  toString: () => 'TestWallet123456789',
};

const mockWallet = {
  adapter: {
    name: 'Phantom',
    icon: 'data:image/svg+xml;base64,phantom',
    publicKey: mockPublicKey,
    readyState: 'Installed',
  },
  publicKey: mockPublicKey,
  readyState: 'Installed',
};

const mockWallets = [
  {
    adapter: {
      name: 'Phantom',
      icon: 'data:image/svg+xml;base64,phantom',
      readyState: 'Installed',
    },
    readyState: 'Installed',
  },
  {
    adapter: {
      name: 'Solflare',
      icon: 'data:image/svg+xml;base64,solflare',
      readyState: 'Installed',
    },
    readyState: 'Installed',
  },
  {
    adapter: {
      name: 'Backpack',
      icon: 'data:image/svg+xml;base64,backpack',
      readyState: 'NotDetected',
    },
    readyState: 'NotDetected',
  },
  {
    adapter: {
      name: 'Ledger',
      icon: 'data:image/svg+xml;base64,ledger',
      readyState: 'Loadable',
    },
    readyState: 'Loadable',
  },
];

const mockSetVisible = vi.fn();
const mockSelect = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: false,
    connecting: false,
    disconnecting: false,
    publicKey: null,
    wallet: null,
    wallets: mockWallets,
    select: mockSelect,
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
  useConnection: vi.fn(() => ({
    connection: {
      getBalance: vi.fn().mockResolvedValue(1000000000),
      rpcEndpoint: 'https://api.devnet.solana.com',
    },
  })),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: vi.fn(() => ({
    visible: false,
    setVisible: mockSetVisible,
  })),
}));

// Import after mocks
import { WalletMultiButton } from '@/components/wallet/WalletMultiButton';
import { WalletModal } from '@/components/wallet/WalletModal';
import { WalletAvatar } from '@/components/wallet/WalletAvatar';
import { ConnectionStatus } from '@/components/wallet/ConnectionStatus';

describe('WalletMultiButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "Connect Wallet" when disconnected', () => {
    render(<WalletMultiButton />);
    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });

  it('should show wallet modal when clicked while disconnected', async () => {
    render(<WalletMultiButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetVisible).toHaveBeenCalledWith(true);
  });

  it('should show shortened address when connected', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletMultiButton />);

    // Should show shortened address like "Test...6789"
    expect(screen.getByText(/Test.*6789/)).toBeInTheDocument();
  });

  it('should show wallet icon when connected', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletMultiButton />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toHaveAttribute('src', mockWallet.adapter.icon);
  });

  it('should show loading state when connecting', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: false,
      connecting: true,
      disconnecting: false,
      publicKey: null,
      wallet: null,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletMultiButton />);

    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it('should show dropdown menu when connected and clicked', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletMultiButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/disconnect/i)).toBeInTheDocument();
    });
  });
});

describe('WalletModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list available wallets', () => {
    render(<WalletModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Phantom')).toBeInTheDocument();
    expect(screen.getByText('Solflare')).toBeInTheDocument();
  });

  it('should show installed status for detected wallets', () => {
    render(<WalletModal isOpen={true} onClose={vi.fn()} />);

    // Phantom and Solflare are "Installed"
    const installedLabels = screen.getAllByText(/installed/i);
    expect(installedLabels.length).toBeGreaterThan(0);
  });

  it('should call select when wallet is clicked', async () => {
    render(<WalletModal isOpen={true} onClose={vi.fn()} />);

    const phantomButton = screen.getByText('Phantom').closest('button');
    if (phantomButton) {
      fireEvent.click(phantomButton);
    }

    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<WalletModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    render(<WalletModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText('Phantom')).not.toBeInTheDocument();
  });

  it('should group wallets by installed status', () => {
    render(<WalletModal isOpen={true} onClose={vi.fn()} />);

    // Should have sections for installed and other wallets
    expect(screen.getByText(/detected wallets/i)).toBeInTheDocument();
  });

  it('should show "Get Wallet" link for not detected wallets', () => {
    render(<WalletModal isOpen={true} onClose={vi.fn()} />);

    // Backpack is NotDetected, should show install option
    const getWalletLinks = screen.getAllByText(/get|install/i);
    expect(getWalletLinks.length).toBeGreaterThan(0);
  });
});

describe('WalletAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render wallet icon when connected', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletAvatar />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockWallet.adapter.icon);
  });

  it('should render placeholder when disconnected', () => {
    render(<WalletAvatar />);

    // Should show default wallet icon
    expect(screen.getByTestId('wallet-avatar-placeholder')).toBeInTheDocument();
  });

  it('should render with custom size', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletAvatar size="lg" />);

    const container = screen.getByTestId('wallet-avatar');
    expect(container).toHaveClass('h-10', 'w-10');
  });

  it('should show address jazzicon when showAddress is true', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<WalletAvatar showAddressIcon />);

    expect(screen.getByTestId('address-icon')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show disconnected status', () => {
    render(<ConnectionStatus />);

    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
  });

  it('should show connected status when wallet is connected', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<ConnectionStatus />);

    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('should show connecting status', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: false,
      connecting: true,
      disconnecting: false,
      publicKey: null,
      wallet: null,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<ConnectionStatus />);

    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it('should show network indicator', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<ConnectionStatus showNetwork />);

    expect(screen.getByText(/devnet|mainnet|testnet/i)).toBeInTheDocument();
  });

  it('should have green indicator when connected', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: true,
      connecting: false,
      disconnecting: false,
      publicKey: mockPublicKey,
      wallet: mockWallet,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<ConnectionStatus />);

    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-green-500');
  });

  it('should have red indicator when disconnected', () => {
    render(<ConnectionStatus />);

    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-red-500');
  });

  it('should have yellow indicator when connecting', async () => {
    const { useWallet } = await import('@solana/wallet-adapter-react');
    vi.mocked(useWallet).mockReturnValueOnce({
      connected: false,
      connecting: true,
      disconnecting: false,
      publicKey: null,
      wallet: null,
      wallets: mockWallets,
      select: mockSelect,
      connect: mockConnect,
      disconnect: mockDisconnect,
    } as any);

    render(<ConnectionStatus />);

    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveClass('bg-yellow-500');
  });
});
