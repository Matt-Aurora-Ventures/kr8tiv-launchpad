/**
 * Tests for the enhanced LaunchWizard component
 * Following TDD: These tests define expected behavior before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: false,
    publicKey: null,
    signMessage: vi.fn(),
  }),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({
    setVisible: vi.fn(),
  }),
}));

// Import after mocks
import { LaunchWizard } from '@/components/launch/LaunchWizard';

describe('LaunchWizard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Step Navigation', () => {
    it('renders the step progress indicator with all steps', () => {
      render(<LaunchWizard />);

      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Tokenomics')).toBeInTheDocument();
      expect(screen.getByText('Tax Config')).toBeInTheDocument();
      expect(screen.getByText('Custom Wallets')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('shows the current step as active', () => {
      render(<LaunchWizard />);

      const basicInfoStep = screen.getByTestId('step-0');
      expect(basicInfoStep).toHaveAttribute('data-active', 'true');
    });

    it('allows navigation to completed steps only', async () => {
      render(<LaunchWizard />);

      // Try clicking a future step - should not navigate
      const reviewStep = screen.getByTestId('step-4');
      await userEvent.click(reviewStep);

      // Should still be on step 0
      expect(screen.getByTestId('step-0')).toHaveAttribute('data-active', 'true');
    });

    it('shows completed checkmark for finished steps', async () => {
      render(<LaunchWizard />);

      // Fill basic info and proceed
      await userEvent.type(screen.getByLabelText(/token name/i), 'Test Token');
      await userEvent.type(screen.getByLabelText(/symbol/i), 'TEST');
      await userEvent.type(screen.getByLabelText(/description/i), 'A test token for testing');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);

      // Step 0 should now show a checkmark
      await waitFor(() => {
        expect(screen.getByTestId('step-0-check')).toBeInTheDocument();
      });
    });
  });

  describe('BasicInfoStep', () => {
    it('validates required fields', async () => {
      render(<LaunchWizard />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);

      // Should show validation errors
      expect(screen.getByText(/token name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/symbol is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });

    it('validates name length (2-32 characters)', async () => {
      render(<LaunchWizard />);

      const nameInput = screen.getByLabelText(/token name/i);
      await userEvent.type(nameInput, 'A'); // Too short
      await userEvent.tab();

      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });

    it('validates symbol format (2-10 uppercase)', async () => {
      render(<LaunchWizard />);

      const symbolInput = screen.getByLabelText(/symbol/i);
      await userEvent.type(symbolInput, 'x'); // Will be uppercased
      await userEvent.tab();

      expect(screen.getByText(/symbol must be at least 2 characters/i)).toBeInTheDocument();
    });

    it('shows image preview when URL is provided', async () => {
      render(<LaunchWizard />);

      const imageInput = screen.getByLabelText(/image url/i);
      await userEvent.type(imageInput, 'https://example.com/token.png');

      await waitFor(() => {
        const preview = screen.getByTestId('image-preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'https://example.com/token.png');
      });
    });

    it('shows upload button for file upload', () => {
      render(<LaunchWizard />);

      expect(screen.getByText(/upload image/i)).toBeInTheDocument();
    });
  });

  describe('TokenomicsStep', () => {
    it('shows supply input with default value', async () => {
      render(<LaunchWizard />);

      // Navigate to tokenomics step
      await fillBasicInfo();

      const supplyInput = screen.getByLabelText(/total supply/i);
      expect(supplyInput).toHaveValue(1000000000); // Default 1B
    });

    it('shows decimals input with default value', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();

      const decimalsInput = screen.getByLabelText(/decimals/i);
      expect(decimalsInput).toHaveValue(9); // Default 9
    });

    it('validates supply range (1 to 1e15)', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();

      const supplyInput = screen.getByLabelText(/total supply/i);
      await userEvent.clear(supplyInput);
      await userEvent.type(supplyInput, '0');
      await userEvent.tab();

      expect(screen.getByText(/supply must be at least 1/i)).toBeInTheDocument();
    });

    it('validates decimals range (0-18)', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();

      const decimalsInput = screen.getByLabelText(/decimals/i);
      await userEvent.clear(decimalsInput);
      await userEvent.type(decimalsInput, '20');
      await userEvent.tab();

      expect(screen.getByText(/decimals must be between 0 and 18/i)).toBeInTheDocument();
    });
  });

  describe('TaxConfigStep', () => {
    it('shows all tax options with sliders', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();

      expect(screen.getByText(/burn tax/i)).toBeInTheDocument();
      expect(screen.getByText(/lp tax/i)).toBeInTheDocument();
      expect(screen.getByText(/holder dividends/i)).toBeInTheDocument();
    });

    it('shows total tax percentage', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();

      expect(screen.getByText(/total tax/i)).toBeInTheDocument();
      expect(screen.getByText(/0%/)).toBeInTheDocument(); // Default is 0
    });

    it('validates total tax does not exceed 25%', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();

      // Enable burn with 10%
      const burnSwitch = screen.getByTestId('burn-switch');
      await userEvent.click(burnSwitch);

      // Enable LP with 10%
      const lpSwitch = screen.getByTestId('lp-switch');
      await userEvent.click(lpSwitch);

      // Enable dividends with 10% (total would be 30%)
      const dividendsSwitch = screen.getByTestId('dividends-switch');
      await userEvent.click(dividendsSwitch);

      // Adjust sliders to exceed 25%
      // This should trigger validation error
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await userEvent.click(continueButton);

      expect(screen.getByText(/total tax cannot exceed 25%/i)).toBeInTheDocument();
    });
  });

  describe('CustomWalletsStep', () => {
    it('shows add wallet button', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();
      await fillTaxConfig();

      expect(screen.getByRole('button', { name: /add wallet/i })).toBeInTheDocument();
    });

    it('allows adding up to 5 custom wallets', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();
      await fillTaxConfig();

      // Add 5 wallets
      for (let i = 0; i < 5; i++) {
        const addButton = screen.getByRole('button', { name: /add wallet/i });
        await userEvent.click(addButton);
      }

      // The add button should be hidden or disabled
      const addButton = screen.queryByRole('button', { name: /add wallet/i });
      expect(addButton).not.toBeInTheDocument();

      expect(screen.getByText(/maximum 5 wallets/i)).toBeInTheDocument();
    });

    it('validates wallet address format', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();
      await fillTaxConfig();

      const addButton = screen.getByRole('button', { name: /add wallet/i });
      await userEvent.click(addButton);

      const addressInput = screen.getByPlaceholderText(/wallet address/i);
      await userEvent.type(addressInput, 'invalid-address');
      await userEvent.tab();

      expect(screen.getByText(/invalid wallet address/i)).toBeInTheDocument();
    });

    it('allows removing wallets', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();
      await fillTaxConfig();

      const addButton = screen.getByRole('button', { name: /add wallet/i });
      await userEvent.click(addButton);

      const removeButton = screen.getByTestId('remove-wallet-0');
      await userEvent.click(removeButton);

      expect(screen.queryByTestId('custom-wallet-0')).not.toBeInTheDocument();
    });
  });

  describe('ReviewStep', () => {
    it('shows token preview card with all configuration', async () => {
      render(<LaunchWizard />);

      await fillAllSteps();

      expect(screen.getByTestId('token-preview-card')).toBeInTheDocument();
      expect(screen.getByText('Test Token')).toBeInTheDocument();
      expect(screen.getByText('TEST')).toBeInTheDocument();
    });

    it('shows cost estimation', async () => {
      render(<LaunchWizard />);

      await fillAllSteps();

      expect(screen.getByText(/estimated cost/i)).toBeInTheDocument();
      expect(screen.getByText(/0.1 SOL/)).toBeInTheDocument(); // Base fee
    });

    it('shows fee discount for staked users', async () => {
      // Mock staking discount
      vi.mock('@/hooks/useDiscount', () => ({
        useDiscount: () => ({
          discount: { tier: 'HOLDER', discount: 10, effectiveFee: 1.8 },
        }),
      }));

      render(<LaunchWizard />);

      await fillAllSteps();

      expect(screen.getByText(/-10%/)).toBeInTheDocument();
    });

    it('allows editing previous steps', async () => {
      render(<LaunchWizard />);

      await fillAllSteps();

      const editBasicInfo = screen.getByTestId('edit-basic-info');
      await userEvent.click(editBasicInfo);

      // Should navigate back to basic info step
      expect(screen.getByTestId('step-0')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('ConfirmStep', () => {
    it('shows confirmation checkbox', async () => {
      render(<LaunchWizard />);

      await fillAllSteps();

      const confirmCheckbox = screen.getByLabelText(/i confirm/i);
      expect(confirmCheckbox).toBeInTheDocument();
    });

    it('requires wallet connection to launch', async () => {
      render(<LaunchWizard />);

      await fillAllSteps();

      const launchButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(launchButton).toBeInTheDocument();
    });

    it('disables launch button until confirmation', async () => {
      // Mock connected wallet
      vi.mocked(require('@solana/wallet-adapter-react').useWallet).mockReturnValue({
        connected: true,
        publicKey: { toBase58: () => 'TestPublicKey123' },
        signMessage: vi.fn(),
      });

      render(<LaunchWizard />);

      await fillAllSteps();

      const launchButton = screen.getByRole('button', { name: /launch token/i });
      expect(launchButton).toBeDisabled();

      const confirmCheckbox = screen.getByLabelText(/i confirm/i);
      await userEvent.click(confirmCheckbox);

      expect(launchButton).toBeEnabled();
    });
  });

  describe('Save Draft Functionality', () => {
    it('auto-saves draft to localStorage on change', async () => {
      render(<LaunchWizard />);

      await userEvent.type(screen.getByLabelText(/token name/i), 'Test Token');

      await waitFor(() => {
        const draft = localStorage.getItem('launch-wizard-draft');
        expect(draft).toBeTruthy();
        const parsed = JSON.parse(draft!);
        expect(parsed.tokenInfo.name).toBe('Test Token');
      });
    });

    it('restores draft from localStorage on mount', async () => {
      // Set draft before rendering
      localStorage.setItem('launch-wizard-draft', JSON.stringify({
        step: 0,
        tokenInfo: {
          name: 'Saved Token',
          symbol: 'SAVED',
          description: 'A saved draft',
          image: '',
          supply: 1000000000,
          decimals: 9,
        },
        taxConfig: {
          burnEnabled: false,
          burnPercent: 0,
          lpEnabled: false,
          lpPercent: 0,
          dividendsEnabled: false,
          dividendsPercent: 0,
          customWalletsEnabled: false,
          customWallets: [],
        },
      }));

      render(<LaunchWizard />);

      expect(screen.getByLabelText(/token name/i)).toHaveValue('Saved Token');
      expect(screen.getByLabelText(/symbol/i)).toHaveValue('SAVED');
    });

    it('shows restore draft dialog if draft exists', async () => {
      localStorage.setItem('launch-wizard-draft', JSON.stringify({
        step: 1,
        tokenInfo: { name: 'Draft Token' },
      }));

      render(<LaunchWizard />);

      expect(screen.getByText(/restore draft/i)).toBeInTheDocument();
      expect(screen.getByText(/you have an unsaved draft/i)).toBeInTheDocument();
    });

    it('allows discarding draft', async () => {
      localStorage.setItem('launch-wizard-draft', JSON.stringify({
        step: 1,
        tokenInfo: { name: 'Draft Token' },
      }));

      render(<LaunchWizard />);

      const discardButton = screen.getByRole('button', { name: /start fresh/i });
      await userEvent.click(discardButton);

      expect(localStorage.getItem('launch-wizard-draft')).toBeNull();
    });

    it('clears draft after successful launch', async () => {
      vi.mocked(require('@solana/wallet-adapter-react').useWallet).mockReturnValue({
        connected: true,
        publicKey: { toBase58: () => 'TestPublicKey123' },
        signMessage: vi.fn().mockResolvedValue(new Uint8Array()),
      });

      // Mock successful API call
      vi.mock('@/lib/api', () => ({
        tokenApi: {
          launch: vi.fn().mockResolvedValue({
            success: true,
            mint: 'TestMint123',
            txSignature: 'TestTx123',
          }),
        },
      }));

      render(<LaunchWizard />);

      await fillAllSteps();

      const confirmCheckbox = screen.getByLabelText(/i confirm/i);
      await userEvent.click(confirmCheckbox);

      const launchButton = screen.getByRole('button', { name: /launch token/i });
      await userEvent.click(launchButton);

      await waitFor(() => {
        expect(localStorage.getItem('launch-wizard-draft')).toBeNull();
      });
    });

    it('shows manual save button', async () => {
      render(<LaunchWizard />);

      await userEvent.type(screen.getByLabelText(/token name/i), 'Test');

      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });
  });

  describe('TokenPreviewCard', () => {
    it('updates in real-time as form changes', async () => {
      render(<LaunchWizard />);

      await userEvent.type(screen.getByLabelText(/token name/i), 'Dynamic Token');

      const previewCard = screen.getByTestId('token-preview-mini');
      expect(previewCard).toHaveTextContent('Dynamic Token');
    });

    it('shows image preview in card', async () => {
      render(<LaunchWizard />);

      await userEvent.type(screen.getByLabelText(/token name/i), 'Test Token');
      await userEvent.type(screen.getByLabelText(/image url/i), 'https://example.com/token.png');

      const previewImage = screen.getByTestId('preview-card-image');
      expect(previewImage).toHaveAttribute('src', 'https://example.com/token.png');
    });

    it('shows placeholder when no image', () => {
      render(<LaunchWizard />);

      const placeholder = screen.getByTestId('preview-card-placeholder');
      expect(placeholder).toBeInTheDocument();
    });

    it('shows tax badges when taxes are configured', async () => {
      render(<LaunchWizard />);

      await fillBasicInfo();
      await fillTokenomics();

      const burnSwitch = screen.getByTestId('burn-switch');
      await userEvent.click(burnSwitch);

      const previewCard = screen.getByTestId('token-preview-mini');
      expect(previewCard).toHaveTextContent(/burn/i);
    });
  });

  describe('CostEstimation', () => {
    it('shows base network fee', async () => {
      render(<LaunchWizard />);

      const costEstimate = screen.getByTestId('cost-estimation');
      expect(costEstimate).toHaveTextContent(/network fee/i);
      expect(costEstimate).toHaveTextContent(/0.1 SOL/i);
    });

    it('shows platform fee', async () => {
      render(<LaunchWizard />);

      const costEstimate = screen.getByTestId('cost-estimation');
      expect(costEstimate).toHaveTextContent(/platform fee/i);
      expect(costEstimate).toHaveTextContent(/2%/i);
    });

    it('shows total estimated cost', async () => {
      render(<LaunchWizard />);

      const costEstimate = screen.getByTestId('cost-estimation');
      expect(costEstimate).toHaveTextContent(/total/i);
    });

    it('applies staking discount to cost', async () => {
      vi.mock('@/hooks/useDiscount', () => ({
        useDiscount: () => ({
          discount: { tier: 'VIP', discount: 50, effectiveFee: 1.0 },
        }),
      }));

      render(<LaunchWizard />);

      const costEstimate = screen.getByTestId('cost-estimation');
      expect(costEstimate).toHaveTextContent(/1%/i); // 50% discount from 2%
      expect(costEstimate).toHaveTextContent(/VIP/i);
    });
  });
});

// Helper functions
async function fillBasicInfo() {
  await userEvent.type(screen.getByLabelText(/token name/i), 'Test Token');
  await userEvent.type(screen.getByLabelText(/symbol/i), 'TEST');
  await userEvent.type(screen.getByLabelText(/description/i), 'A test token for testing purposes.');

  const continueButton = screen.getByRole('button', { name: /continue/i });
  await userEvent.click(continueButton);
}

async function fillTokenomics() {
  // Use defaults, just continue
  const continueButton = screen.getByRole('button', { name: /continue/i });
  await userEvent.click(continueButton);
}

async function fillTaxConfig() {
  // Use defaults (all disabled), just continue
  const continueButton = screen.getByRole('button', { name: /continue/i });
  await userEvent.click(continueButton);
}

async function fillCustomWallets() {
  // Skip adding wallets, just continue
  const continueButton = screen.getByRole('button', { name: /continue/i });
  await userEvent.click(continueButton);
}

async function fillAllSteps() {
  await fillBasicInfo();
  await fillTokenomics();
  await fillTaxConfig();
  await fillCustomWallets();
  // Should now be on Review step
}
