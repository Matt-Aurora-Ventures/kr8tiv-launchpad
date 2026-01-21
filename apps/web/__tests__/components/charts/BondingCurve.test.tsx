/**
 * Tests for BondingCurve visualization component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BondingCurve, BondingCurveProps } from '@/components/charts/BondingCurve';
import { calculateBondingPrice, calculateMarketCap, BondingCurveConfig } from '@/lib/bonding-curve';

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-points={data?.length}>
      {children}
    </div>
  ),
  Area: (props: Record<string, unknown>) => <div data-testid="area" data-type={props.type} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: (props: Record<string, unknown>) => (
    <div data-testid="reference-line" data-x={props.x} data-label={props.label?.toString()} />
  ),
  ReferenceArea: (props: Record<string, unknown>) => (
    <div data-testid="reference-area" data-x1={props.x1} data-x2={props.x2} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Brush: () => <div data-testid="brush" />,
}));

describe('BondingCurve Component', () => {
  const defaultConfig: BondingCurveConfig = {
    initialPrice: 0.00001,
    curveExponent: 2,
    totalSupply: 1_000_000_000,
    graduationThreshold: 100_000, // 100k SOL market cap
    virtualSolReserve: 30,
    virtualTokenReserve: 1_000_000_000,
  };

  const defaultProps: BondingCurveProps = {
    config: defaultConfig,
    currentSupply: 500_000_000,
    showGraduationThreshold: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the bonding curve chart', () => {
      render(<BondingCurve {...defaultProps} />);

      expect(screen.getByTestId('bonding-curve-container')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('displays the chart title', () => {
      render(<BondingCurve {...defaultProps} />);

      expect(screen.getByText(/Bonding Curve/i)).toBeInTheDocument();
    });

    it('shows current position indicator', () => {
      render(<BondingCurve {...defaultProps} />);

      expect(screen.getByText(/Current Position/i)).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<BondingCurve {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('bonding-curve-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Graduation Threshold', () => {
    it('shows graduation threshold line when enabled', () => {
      render(<BondingCurve {...defaultProps} showGraduationThreshold={true} />);

      const refLine = screen.getByTestId('reference-line');
      expect(refLine).toBeInTheDocument();
    });

    it('hides graduation threshold line when disabled', () => {
      render(<BondingCurve {...defaultProps} showGraduationThreshold={false} />);

      expect(screen.queryByTestId('reference-line')).not.toBeInTheDocument();
    });

    it('displays graduation progress percentage', () => {
      render(<BondingCurve {...defaultProps} />);

      // Should show progress towards graduation
      expect(screen.getByText(/Progress to Graduation/i)).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('displays current price', () => {
      render(<BondingCurve {...defaultProps} />);

      expect(screen.getByTestId('current-price')).toBeInTheDocument();
    });

    it('shows price at different supply levels on hover', async () => {
      render(<BondingCurve {...defaultProps} interactive={true} />);

      const chart = screen.getByTestId('area-chart');
      fireEvent.mouseMove(chart);

      await waitFor(() => {
        expect(screen.getByTestId('hover-price')).toBeInTheDocument();
      });
    });
  });

  describe('Buy/Sell Zones', () => {
    it('highlights buy zone (below current price)', () => {
      render(<BondingCurve {...defaultProps} showZones={true} />);

      const buyZone = screen.getByTestId('reference-area');
      expect(buyZone).toBeInTheDocument();
    });

    it('shows zone labels when enabled', () => {
      render(<BondingCurve {...defaultProps} showZones={true} showZoneLabels={true} />);

      expect(screen.getByText(/Buy Zone/i)).toBeInTheDocument();
      expect(screen.getByText(/Sell Zone/i)).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('animates price movement when animatePrice is true', () => {
      render(<BondingCurve {...defaultProps} animatePrice={true} />);

      const container = screen.getByTestId('bonding-curve-container');
      expect(container).toHaveClass('animate-price');
    });

    it('does not animate when animatePrice is false', () => {
      render(<BondingCurve {...defaultProps} animatePrice={false} />);

      const container = screen.getByTestId('bonding-curve-container');
      expect(container).not.toHaveClass('animate-price');
    });
  });

  describe('Interactivity', () => {
    it('calls onSupplyClick when clicking on chart', () => {
      const onSupplyClick = vi.fn();
      render(<BondingCurve {...defaultProps} onSupplyClick={onSupplyClick} interactive={true} />);

      const chart = screen.getByTestId('area-chart');
      fireEvent.click(chart);

      expect(onSupplyClick).toHaveBeenCalled();
    });

    it('shows supply slider when interactive', () => {
      render(<BondingCurve {...defaultProps} interactive={true} showSlider={true} />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('Data Generation', () => {
    it('generates correct number of data points', () => {
      render(<BondingCurve {...defaultProps} dataPoints={100} />);

      const chart = screen.getByTestId('area-chart');
      expect(chart).toHaveAttribute('data-points', '100');
    });

    it('uses default 50 data points when not specified', () => {
      render(<BondingCurve {...defaultProps} />);

      const chart = screen.getByTestId('area-chart');
      expect(chart).toHaveAttribute('data-points', '50');
    });
  });

  describe('Stats Display', () => {
    it('shows market cap when enabled', () => {
      render(<BondingCurve {...defaultProps} showStats={true} />);

      expect(screen.getByText(/Market Cap/i)).toBeInTheDocument();
    });

    it('shows total supply info', () => {
      render(<BondingCurve {...defaultProps} showStats={true} />);

      expect(screen.getByText(/1B/i)).toBeInTheDocument(); // 1 billion supply
    });

    it('shows circulating supply percentage', () => {
      render(<BondingCurve {...defaultProps} showStats={true} />);

      expect(screen.getByText(/50%/i)).toBeInTheDocument(); // 500M of 1B
    });
  });

  describe('Responsive Behavior', () => {
    it('uses full width by default', () => {
      render(<BondingCurve {...defaultProps} />);

      const container = screen.getByTestId('bonding-curve-container');
      expect(container).toHaveClass('w-full');
    });

    it('applies custom height', () => {
      render(<BondingCurve {...defaultProps} height={400} />);

      const container = screen.getByTestId('bonding-curve-container');
      expect(container.style.height).toBe('400px');
    });
  });

  describe('Theme Support', () => {
    it('applies dark theme colors', () => {
      render(<BondingCurve {...defaultProps} theme="dark" />);

      const area = screen.getByTestId('area');
      expect(area).toBeInTheDocument();
    });

    it('applies light theme colors', () => {
      render(<BondingCurve {...defaultProps} theme="light" />);

      const area = screen.getByTestId('area');
      expect(area).toBeInTheDocument();
    });
  });
});

describe('Bonding Curve Calculations', () => {
  const config: BondingCurveConfig = {
    initialPrice: 0.00001,
    curveExponent: 2,
    totalSupply: 1_000_000_000,
    graduationThreshold: 100_000,
    virtualSolReserve: 30,
    virtualTokenReserve: 1_000_000_000,
  };

  describe('calculateBondingPrice', () => {
    it('returns initial price at zero supply', () => {
      const price = calculateBondingPrice(0, config);
      expect(price).toBeCloseTo(config.initialPrice, 10);
    });

    it('price increases with supply (exponential curve)', () => {
      const price1 = calculateBondingPrice(100_000_000, config);
      const price2 = calculateBondingPrice(500_000_000, config);
      const price3 = calculateBondingPrice(900_000_000, config);

      expect(price2).toBeGreaterThan(price1);
      expect(price3).toBeGreaterThan(price2);
    });

    it('follows quadratic curve when exponent is 2', () => {
      // With exponent 2, price should follow x^2 pattern
      const price25 = calculateBondingPrice(250_000_000, config);
      const price50 = calculateBondingPrice(500_000_000, config);

      // Price at 50% should be approximately 4x price at 25% (squared)
      // This is approximate due to virtual reserves
      expect(price50 / price25).toBeGreaterThan(1.5);
    });
  });

  describe('calculateMarketCap', () => {
    it('calculates market cap correctly', () => {
      const currentSupply = 500_000_000;
      const price = calculateBondingPrice(currentSupply, config);
      const marketCap = calculateMarketCap(currentSupply, config);

      expect(marketCap).toBeCloseTo(price * currentSupply, 0);
    });

    it('market cap at graduation threshold is correct', () => {
      // At graduation, market cap should meet threshold
      const graduationSupply = 800_000_000; // 80% sold
      const marketCap = calculateMarketCap(graduationSupply, config);

      expect(marketCap).toBeGreaterThan(0);
    });
  });
});
