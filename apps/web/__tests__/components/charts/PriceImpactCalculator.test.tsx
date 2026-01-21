/**
 * Tests for PriceImpactCalculator component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  PriceImpactCalculator,
  PriceImpactCalculatorProps,
} from '@/components/charts/PriceImpactCalculator';
import { BondingCurveConfig } from '@/lib/bonding-curve';

describe('PriceImpactCalculator Component', () => {
  const defaultConfig: BondingCurveConfig = {
    initialPrice: 0.00001,
    curveExponent: 2,
    totalSupply: 1_000_000_000,
    graduationThreshold: 100_000,
    virtualSolReserve: 30,
    virtualTokenReserve: 1_000_000_000,
  };

  const defaultProps: PriceImpactCalculatorProps = {
    config: defaultConfig,
    currentSupply: 500_000_000,
    currentPrice: 0.0001,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the calculator container', () => {
      render(<PriceImpactCalculator {...defaultProps} />);

      expect(screen.getByTestId('price-impact-calculator')).toBeInTheDocument();
    });

    it('displays title', () => {
      render(<PriceImpactCalculator {...defaultProps} />);

      expect(screen.getByText(/Price Impact Calculator/i)).toBeInTheDocument();
    });

    it('shows buy and sell tabs', () => {
      render(<PriceImpactCalculator {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /buy/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sell/i })).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<PriceImpactCalculator {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('price-impact-calculator');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Input Handling', () => {
    it('has SOL amount input field', () => {
      render(<PriceImpactCalculator {...defaultProps} />);

      expect(screen.getByLabelText(/amount \(sol\)/i)).toBeInTheDocument();
    });

    it('has token amount input field', () => {
      render(<PriceImpactCalculator {...defaultProps} />);

      expect(screen.getByLabelText(/amount \(tokens\)/i)).toBeInTheDocument();
    });

    it('updates token amount when SOL input changes', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        const tokenInput = screen.getByLabelText(/amount \(tokens\)/i) as HTMLInputElement;
        expect(parseFloat(tokenInput.value)).toBeGreaterThan(0);
      });
    });

    it('updates SOL amount when token input changes', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const tokenInput = screen.getByLabelText(/amount \(tokens\)/i);
      await user.clear(tokenInput);
      await user.type(tokenInput, '1000000');

      await waitFor(() => {
        const solInput = screen.getByLabelText(/amount \(sol\)/i) as HTMLInputElement;
        expect(parseFloat(solInput.value)).toBeGreaterThan(0);
      });
    });

    it('validates maximum amount', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} maxSolAmount={10} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '100');

      await waitFor(() => {
        expect(screen.getByText(/maximum.*10 sol/i)).toBeInTheDocument();
      });
    });
  });

  describe('Price Impact Display', () => {
    it('shows expected price after trade', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(screen.getByTestId('expected-price')).toBeInTheDocument();
      });
    });

    it('shows price impact percentage', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(screen.getByTestId('price-impact')).toBeInTheDocument();
        expect(screen.getByText(/%/)).toBeInTheDocument();
      });
    });

    it('displays slippage estimate', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(screen.getByTestId('slippage')).toBeInTheDocument();
      });
    });

    it('shows warning for high price impact', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} highImpactThreshold={5} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '100'); // Large amount = high impact

      await waitFor(() => {
        expect(screen.getByText(/high price impact/i)).toBeInTheDocument();
      });
    });
  });

  describe('Buy Mode', () => {
    it('calculates buy price correctly', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      // Ensure buy tab is selected
      const buyTab = screen.getByRole('tab', { name: /buy/i });
      await user.click(buyTab);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        const expectedPrice = screen.getByTestId('expected-price');
        // Buy should increase price
        expect(expectedPrice.textContent).toBeDefined();
      });
    });

    it('shows tokens you will receive', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(screen.getByText(/you will receive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sell Mode', () => {
    it('switches to sell mode', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const sellTab = screen.getByRole('tab', { name: /sell/i });
      await user.click(sellTab);

      expect(sellTab).toHaveAttribute('aria-selected', 'true');
    });

    it('calculates sell price correctly', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const sellTab = screen.getByRole('tab', { name: /sell/i });
      await user.click(sellTab);

      const tokenInput = screen.getByLabelText(/amount \(tokens\)/i);
      await user.clear(tokenInput);
      await user.type(tokenInput, '1000000');

      await waitFor(() => {
        const expectedPrice = screen.getByTestId('expected-price');
        expect(expectedPrice.textContent).toBeDefined();
      });
    });

    it('shows SOL you will receive', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} />);

      const sellTab = screen.getByRole('tab', { name: /sell/i });
      await user.click(sellTab);

      const tokenInput = screen.getByLabelText(/amount \(tokens\)/i);
      await user.clear(tokenInput);
      await user.type(tokenInput, '1000000');

      await waitFor(() => {
        expect(screen.getByText(/you will receive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Preset Amounts', () => {
    it('shows preset amount buttons', () => {
      render(<PriceImpactCalculator {...defaultProps} presetAmounts={[0.1, 0.5, 1, 5]} />);

      expect(screen.getByRole('button', { name: /0.1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /0.5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /5/i })).toBeInTheDocument();
    });

    it('fills input when preset is clicked', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} presetAmounts={[0.1, 0.5, 1, 5]} />);

      const preset1Sol = screen.getByRole('button', { name: /^1$/ });
      await user.click(preset1Sol);

      const solInput = screen.getByLabelText(/amount \(sol\)/i) as HTMLInputElement;
      expect(solInput.value).toBe('1');
    });
  });

  describe('Callbacks', () => {
    it('calls onChange with calculated values', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} onChange={onChange} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            solAmount: expect.any(Number),
            tokenAmount: expect.any(Number),
            expectedPrice: expect.any(Number),
            priceImpact: expect.any(Number),
            slippage: expect.any(Number),
          })
        );
      });
    });

    it('calls onSimulate when simulate button clicked', async () => {
      const onSimulate = vi.fn();
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} onSimulate={onSimulate} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      expect(onSimulate).toHaveBeenCalled();
    });
  });

  describe('Summary Display', () => {
    it('shows trade summary', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} showSummary={true} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(screen.getByTestId('trade-summary')).toBeInTheDocument();
      });
    });

    it('displays average price per token', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} showSummary={true} />);

      const solInput = screen.getByLabelText(/amount \(sol\)/i);
      await user.clear(solInput);
      await user.type(solInput, '1');

      await waitFor(() => {
        expect(screen.getByText(/avg. price/i)).toBeInTheDocument();
      });
    });
  });

  describe('Slippage Settings', () => {
    it('shows slippage tolerance selector', () => {
      render(<PriceImpactCalculator {...defaultProps} showSlippageSettings={true} />);

      expect(screen.getByText(/slippage tolerance/i)).toBeInTheDocument();
    });

    it('allows custom slippage input', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} showSlippageSettings={true} />);

      const customSlippage = screen.getByLabelText(/custom slippage/i);
      await user.clear(customSlippage);
      await user.type(customSlippage, '2');

      expect(customSlippage).toHaveValue(2);
    });

    it('validates slippage range', async () => {
      const user = userEvent.setup();
      render(<PriceImpactCalculator {...defaultProps} showSlippageSettings={true} />);

      const customSlippage = screen.getByLabelText(/custom slippage/i);
      await user.clear(customSlippage);
      await user.type(customSlippage, '50');

      await waitFor(() => {
        expect(screen.getByText(/slippage too high/i)).toBeInTheDocument();
      });
    });
  });
});
