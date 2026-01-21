/**
 * Tests for LiquidityDepth visualization component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LiquidityDepth, LiquidityDepthProps } from '@/components/charts/LiquidityDepth';
import { BondingCurveConfig } from '@/lib/bonding-curve';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-points={data?.length}>
      {children}
    </div>
  ),
  Area: (props: Record<string, unknown>) => <div data-testid="area" data-fill={props.fill} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: (props: Record<string, unknown>) => (
    <div data-testid="reference-line" data-x={props.x} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('LiquidityDepth Component', () => {
  const defaultConfig: BondingCurveConfig = {
    initialPrice: 0.00001,
    curveExponent: 2,
    totalSupply: 1_000_000_000,
    graduationThreshold: 100_000,
    virtualSolReserve: 30,
    virtualTokenReserve: 1_000_000_000,
  };

  const defaultProps: LiquidityDepthProps = {
    config: defaultConfig,
    currentSupply: 500_000_000,
    currentPrice: 0.0001,
    priceRange: 20, // +/- 20% from current price
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the liquidity depth container', () => {
      render(<LiquidityDepth {...defaultProps} />);

      expect(screen.getByTestId('liquidity-depth-container')).toBeInTheDocument();
    });

    it('displays title', () => {
      render(<LiquidityDepth {...defaultProps} />);

      expect(screen.getByText(/Liquidity Depth/i)).toBeInTheDocument();
    });

    it('renders the chart', () => {
      render(<LiquidityDepth {...defaultProps} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<LiquidityDepth {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('liquidity-depth-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Bid/Ask Display', () => {
    it('shows bid (buy) side in green', () => {
      render(<LiquidityDepth {...defaultProps} />);

      const areas = screen.getAllByTestId('area');
      const bidArea = areas.find((a) => a.getAttribute('data-fill')?.includes('green'));
      expect(bidArea).toBeInTheDocument();
    });

    it('shows ask (sell) side in red', () => {
      render(<LiquidityDepth {...defaultProps} />);

      const areas = screen.getAllByTestId('area');
      const askArea = areas.find((a) => a.getAttribute('data-fill')?.includes('red'));
      expect(askArea).toBeInTheDocument();
    });

    it('shows current price line', () => {
      render(<LiquidityDepth {...defaultProps} />);

      expect(screen.getByTestId('reference-line')).toBeInTheDocument();
    });
  });

  describe('Price Range', () => {
    it('uses provided price range', () => {
      render(<LiquidityDepth {...defaultProps} priceRange={50} />);

      // Chart should have data points spanning the price range
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('allows adjustable price range', () => {
      render(<LiquidityDepth {...defaultProps} adjustablePriceRange={true} />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('updates chart when price range changes', async () => {
      render(<LiquidityDepth {...defaultProps} adjustablePriceRange={true} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '50' } });

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Depth Metrics', () => {
    it('shows total liquidity available', () => {
      render(<LiquidityDepth {...defaultProps} showMetrics={true} />);

      expect(screen.getByText(/Total Liquidity/i)).toBeInTheDocument();
    });

    it('shows bid depth', () => {
      render(<LiquidityDepth {...defaultProps} showMetrics={true} />);

      expect(screen.getByTestId('bid-depth')).toBeInTheDocument();
    });

    it('shows ask depth', () => {
      render(<LiquidityDepth {...defaultProps} showMetrics={true} />);

      expect(screen.getByTestId('ask-depth')).toBeInTheDocument();
    });

    it('shows depth ratio', () => {
      render(<LiquidityDepth {...defaultProps} showMetrics={true} />);

      expect(screen.getByText(/Depth Ratio/i)).toBeInTheDocument();
    });
  });

  describe('Depth Levels', () => {
    it('shows liquidity at different price levels', () => {
      render(<LiquidityDepth {...defaultProps} showDepthLevels={true} />);

      expect(screen.getByTestId('depth-levels')).toBeInTheDocument();
    });

    it('displays price levels in order', () => {
      render(<LiquidityDepth {...defaultProps} showDepthLevels={true} depthLevels={5} />);

      const levels = screen.getAllByTestId('depth-level');
      expect(levels.length).toBe(5);
    });
  });

  describe('Interactive Features', () => {
    it('shows tooltip on hover', async () => {
      render(<LiquidityDepth {...defaultProps} interactive={true} />);

      const chart = screen.getByTestId('area-chart');
      fireEvent.mouseMove(chart);

      await waitFor(() => {
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      });
    });

    it('highlights price level on hover', async () => {
      render(<LiquidityDepth {...defaultProps} interactive={true} />);

      const chart = screen.getByTestId('area-chart');
      fireEvent.mouseMove(chart);

      await waitFor(() => {
        expect(screen.getByTestId('hover-indicator')).toBeInTheDocument();
      });
    });

    it('calls onPriceSelect when clicking price level', async () => {
      const onPriceSelect = vi.fn();
      render(<LiquidityDepth {...defaultProps} onPriceSelect={onPriceSelect} interactive={true} />);

      const chart = screen.getByTestId('area-chart');
      fireEvent.click(chart);

      expect(onPriceSelect).toHaveBeenCalled();
    });
  });

  describe('Market Order Simulation', () => {
    it('shows market order impact preview', () => {
      render(<LiquidityDepth {...defaultProps} orderAmount={10} showOrderImpact={true} />);

      expect(screen.getByTestId('order-impact')).toBeInTheDocument();
    });

    it('highlights liquidity consumed by order', () => {
      render(<LiquidityDepth {...defaultProps} orderAmount={10} showOrderImpact={true} />);

      expect(screen.getByTestId('liquidity-consumed')).toBeInTheDocument();
    });

    it('shows execution price for order size', () => {
      render(<LiquidityDepth {...defaultProps} orderAmount={10} showOrderImpact={true} />);

      expect(screen.getByText(/Execution Price/i)).toBeInTheDocument();
    });
  });

  describe('Visual Customization', () => {
    it('applies custom colors', () => {
      render(
        <LiquidityDepth
          {...defaultProps}
          bidColor="#00ff00"
          askColor="#ff0000"
        />
      );

      const areas = screen.getAllByTestId('area');
      expect(areas.length).toBeGreaterThan(0);
    });

    it('supports gradient fill', () => {
      render(<LiquidityDepth {...defaultProps} gradientFill={true} />);

      expect(screen.getByTestId('liquidity-depth-container')).toBeInTheDocument();
    });

    it('applies custom height', () => {
      render(<LiquidityDepth {...defaultProps} height={500} />);

      const container = screen.getByTestId('liquidity-depth-container');
      expect(container.style.height).toBe('500px');
    });
  });

  describe('Legend', () => {
    it('shows legend when enabled', () => {
      render(<LiquidityDepth {...defaultProps} showLegend={true} />);

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('hides legend when disabled', () => {
      render(<LiquidityDepth {...defaultProps} showLegend={false} />);

      expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      render(<LiquidityDepth {...defaultProps} loading={true} />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('hides chart when loading', () => {
      render(<LiquidityDepth {...defaultProps} loading={true} />);

      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no data', () => {
      render(<LiquidityDepth config={defaultConfig} currentSupply={0} currentPrice={0} />);

      expect(screen.getByText(/no liquidity data/i)).toBeInTheDocument();
    });
  });
});
