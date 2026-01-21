/**
 * Tests for TradeSimulator component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TradeSimulator, TradeSimulatorProps } from '@/components/charts/TradeSimulator';
import { BondingCurveConfig } from '@/lib/bonding-curve';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: (props: Record<string, unknown>) => (
    <div data-testid="line" data-name={props.name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('TradeSimulator Component', () => {
  const defaultConfig: BondingCurveConfig = {
    initialPrice: 0.00001,
    curveExponent: 2,
    totalSupply: 1_000_000_000,
    graduationThreshold: 100_000,
    virtualSolReserve: 30,
    virtualTokenReserve: 1_000_000_000,
  };

  const defaultProps: TradeSimulatorProps = {
    config: defaultConfig,
    currentSupply: 500_000_000,
    currentPrice: 0.0001,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the simulator container', () => {
      render(<TradeSimulator {...defaultProps} />);

      expect(screen.getByTestId('trade-simulator')).toBeInTheDocument();
    });

    it('displays title', () => {
      render(<TradeSimulator {...defaultProps} />);

      expect(screen.getByText(/Trade Simulator/i)).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<TradeSimulator {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('trade-simulator');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Trade Input', () => {
    it('has trade type selector (buy/sell)', () => {
      render(<TradeSimulator {...defaultProps} />);

      expect(screen.getByRole('button', { name: /buy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sell/i })).toBeInTheDocument();
    });

    it('has amount input field', () => {
      render(<TradeSimulator {...defaultProps} />);

      expect(screen.getByLabelText(/trade amount/i)).toBeInTheDocument();
    });

    it('shows simulate trade button', () => {
      render(<TradeSimulator {...defaultProps} />);

      expect(screen.getByRole('button', { name: /simulate/i })).toBeInTheDocument();
    });

    it('has reset button', () => {
      render(<TradeSimulator {...defaultProps} />);

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe('Simulation Results', () => {
    it('shows before/after price comparison', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('price-before')).toBeInTheDocument();
        expect(screen.getByTestId('price-after')).toBeInTheDocument();
      });
    });

    it('shows price change percentage', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('price-change')).toBeInTheDocument();
      });
    });

    it('shows tokens received/given', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('token-amount')).toBeInTheDocument();
      });
    });

    it('shows total cost/proceeds', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-value')).toBeInTheDocument();
      });
    });
  });

  describe('Price Chart Visualization', () => {
    it('shows price movement chart after simulation', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showChart={true} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('shows before/after lines on chart', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showChart={true} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        const lines = screen.getAllByTestId('line');
        expect(lines.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Trade History', () => {
    it('shows simulated trade history', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showHistory={true} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('trade-history')).toBeInTheDocument();
      });
    });

    it('allows multiple simulations in sequence', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showHistory={true} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      const simulateBtn = screen.getByRole('button', { name: /simulate/i });

      // First trade
      await user.type(amountInput, '1');
      await user.click(simulateBtn);

      // Second trade
      await user.clear(amountInput);
      await user.type(amountInput, '2');
      await user.click(simulateBtn);

      await waitFor(() => {
        const historyItems = screen.getAllByTestId('history-item');
        expect(historyItems.length).toBe(2);
      });
    });

    it('clears history on reset', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showHistory={true} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      const resetBtn = screen.getByRole('button', { name: /reset/i });
      await user.click(resetBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('history-item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Supply Tracking', () => {
    it('shows updated supply after trade', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('supply-before')).toBeInTheDocument();
        expect(screen.getByTestId('supply-after')).toBeInTheDocument();
      });
    });

    it('shows graduation progress change', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showGraduationProgress={true} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '10');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('graduation-progress')).toBeInTheDocument();
      });
    });
  });

  describe('Profit/Loss Calculation', () => {
    it('shows potential P&L for round trip', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showProfitLoss={true} />);

      // Buy
      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');
      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      // Sell
      const sellBtn = screen.getByRole('button', { name: /sell/i });
      await user.click(sellBtn);
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('profit-loss')).toBeInTheDocument();
      });
    });
  });

  describe('Scenario Presets', () => {
    it('shows scenario preset buttons', () => {
      render(<TradeSimulator {...defaultProps} showPresets={true} />);

      expect(screen.getByRole('button', { name: /small trade/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /medium trade/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /large trade/i })).toBeInTheDocument();
    });

    it('applies preset and simulates', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} showPresets={true} />);

      const mediumPreset = screen.getByRole('button', { name: /medium trade/i });
      await user.click(mediumPreset);

      await waitFor(() => {
        expect(screen.getByTestId('price-after')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('calls onSimulate with trade details', async () => {
      const onSimulate = vi.fn();
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} onSimulate={onSimulate} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(onSimulate).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.any(String),
            amount: expect.any(Number),
            priceBefore: expect.any(Number),
            priceAfter: expect.any(Number),
            supplyBefore: expect.any(Number),
            supplyAfter: expect.any(Number),
          })
        );
      });
    });

    it('calls onReset when reset clicked', async () => {
      const onReset = vi.fn();
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} onReset={onReset} />);

      const resetBtn = screen.getByRole('button', { name: /reset/i });
      await user.click(resetBtn);

      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('shows error for zero amount', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '0');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('shows error for negative amount', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '-1');

      const simulateBtn = screen.getByRole('button', { name: /simulate/i });
      await user.click(simulateBtn);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('shows warning for large trades', async () => {
      const user = userEvent.setup();
      render(<TradeSimulator {...defaultProps} largeTradeThreshold={10} />);

      const amountInput = screen.getByLabelText(/trade amount/i);
      await user.type(amountInput, '100');

      await waitFor(() => {
        expect(screen.getByText(/large trade warning/i)).toBeInTheDocument();
      });
    });
  });
});
