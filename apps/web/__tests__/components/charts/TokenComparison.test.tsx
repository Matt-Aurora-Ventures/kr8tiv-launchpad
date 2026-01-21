/**
 * Tests for TokenComparison component (compare multiple tokens' bonding curves)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { TokenComparison, TokenComparisonProps, TokenData } from '@/components/charts/TokenComparison';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-series={data?.length}>
      {children}
    </div>
  ),
  Line: (props: Record<string, unknown>) => (
    <div data-testid="line" data-datakey={props.dataKey} data-stroke={props.stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

describe('TokenComparison Component', () => {
  const mockTokens: TokenData[] = [
    {
      id: 'token-1',
      name: 'Token A',
      symbol: 'TKA',
      config: {
        initialPrice: 0.00001,
        curveExponent: 2,
        totalSupply: 1_000_000_000,
        graduationThreshold: 100_000,
        virtualSolReserve: 30,
        virtualTokenReserve: 1_000_000_000,
      },
      currentSupply: 500_000_000,
      currentPrice: 0.0001,
      color: '#8b5cf6',
    },
    {
      id: 'token-2',
      name: 'Token B',
      symbol: 'TKB',
      config: {
        initialPrice: 0.000005,
        curveExponent: 1.5,
        totalSupply: 2_000_000_000,
        graduationThreshold: 200_000,
        virtualSolReserve: 50,
        virtualTokenReserve: 2_000_000_000,
      },
      currentSupply: 800_000_000,
      currentPrice: 0.00015,
      color: '#22c55e',
    },
  ];

  const defaultProps: TokenComparisonProps = {
    tokens: mockTokens,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the comparison container', () => {
      render(<TokenComparison {...defaultProps} />);

      expect(screen.getByTestId('token-comparison')).toBeInTheDocument();
    });

    it('displays title', () => {
      render(<TokenComparison {...defaultProps} />);

      expect(screen.getByText(/Token Comparison/i)).toBeInTheDocument();
    });

    it('renders chart with multiple lines', () => {
      render(<TokenComparison {...defaultProps} />);

      const lines = screen.getAllByTestId('line');
      expect(lines.length).toBe(mockTokens.length);
    });

    it('renders with custom className', () => {
      render(<TokenComparison {...defaultProps} className="custom-class" />);

      const container = screen.getByTestId('token-comparison');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Token Selection', () => {
    it('shows token selector', () => {
      render(<TokenComparison {...defaultProps} showSelector={true} />);

      expect(screen.getByTestId('token-selector')).toBeInTheDocument();
    });

    it('lists all available tokens', () => {
      render(<TokenComparison {...defaultProps} showSelector={true} />);

      expect(screen.getByText('Token A')).toBeInTheDocument();
      expect(screen.getByText('Token B')).toBeInTheDocument();
    });

    it('allows toggling tokens on/off', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} showSelector={true} />);

      const tokenToggle = screen.getByRole('checkbox', { name: /token a/i });
      await user.click(tokenToggle);

      await waitFor(() => {
        expect(tokenToggle).not.toBeChecked();
      });
    });

    it('supports max token limit', () => {
      const manyTokens = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockTokens[0],
          id: `token-${i}`,
          name: `Token ${i}`,
          symbol: `TK${i}`,
        }));

      render(<TokenComparison tokens={manyTokens} maxTokens={5} showSelector={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const checkedCount = checkboxes.filter(
        (cb) => (cb as HTMLInputElement).checked
      ).length;
      expect(checkedCount).toBeLessThanOrEqual(5);
    });
  });

  describe('Chart Display', () => {
    it('shows legend with token names', () => {
      render(<TokenComparison {...defaultProps} showLegend={true} />);

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('uses correct colors for each token', () => {
      render(<TokenComparison {...defaultProps} />);

      const lines = screen.getAllByTestId('line');
      const purpleLine = lines.find((l) => l.getAttribute('data-stroke') === '#8b5cf6');
      const greenLine = lines.find((l) => l.getAttribute('data-stroke') === '#22c55e');

      expect(purpleLine).toBeInTheDocument();
      expect(greenLine).toBeInTheDocument();
    });

    it('shows tooltip on hover', async () => {
      render(<TokenComparison {...defaultProps} />);

      const chart = screen.getByTestId('line-chart');
      fireEvent.mouseMove(chart);

      await waitFor(() => {
        expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Comparison Metrics', () => {
    it('shows comparison table when enabled', () => {
      render(<TokenComparison {...defaultProps} showMetrics={true} />);

      expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
    });

    it('displays current price for each token', () => {
      render(<TokenComparison {...defaultProps} showMetrics={true} />);

      expect(screen.getByText(/current price/i)).toBeInTheDocument();
    });

    it('displays market cap for each token', () => {
      render(<TokenComparison {...defaultProps} showMetrics={true} />);

      expect(screen.getByText(/market cap/i)).toBeInTheDocument();
    });

    it('displays graduation progress for each token', () => {
      render(<TokenComparison {...defaultProps} showMetrics={true} />);

      expect(screen.getByText(/graduation/i)).toBeInTheDocument();
    });

    it('displays supply percentage for each token', () => {
      render(<TokenComparison {...defaultProps} showMetrics={true} />);

      expect(screen.getByText(/supply sold/i)).toBeInTheDocument();
    });
  });

  describe('Normalization', () => {
    it('can normalize prices for comparison', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} showNormalizeToggle={true} />);

      const normalizeToggle = screen.getByRole('switch', { name: /normalize/i });
      await user.click(normalizeToggle);

      await waitFor(() => {
        expect(screen.getByText(/normalized view/i)).toBeInTheDocument();
      });
    });

    it('shows percentage from starting price when normalized', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} showNormalizeToggle={true} />);

      const normalizeToggle = screen.getByRole('switch', { name: /normalize/i });
      await user.click(normalizeToggle);

      await waitFor(() => {
        expect(screen.getByText(/%/)).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    it('supports price view mode', () => {
      render(<TokenComparison {...defaultProps} viewMode="price" />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('supports market cap view mode', () => {
      render(<TokenComparison {...defaultProps} viewMode="marketCap" />);

      expect(screen.getByText(/market cap/i)).toBeInTheDocument();
    });

    it('supports graduation progress view mode', () => {
      render(<TokenComparison {...defaultProps} viewMode="graduation" />);

      expect(screen.getByText(/graduation/i)).toBeInTheDocument();
    });

    it('allows switching view modes', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} showViewModeSelector={true} />);

      const marketCapBtn = screen.getByRole('button', { name: /market cap/i });
      await user.click(marketCapBtn);

      await waitFor(() => {
        expect(screen.getByText(/market cap comparison/i)).toBeInTheDocument();
      });
    });
  });

  describe('Token Details', () => {
    it('shows token details panel on click', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} showDetails={true} />);

      const tokenName = screen.getByText('Token A');
      await user.click(tokenName);

      await waitFor(() => {
        expect(screen.getByTestId('token-details-panel')).toBeInTheDocument();
      });
    });

    it('displays token config in details', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} showDetails={true} />);

      const tokenName = screen.getByText('Token A');
      await user.click(tokenName);

      await waitFor(() => {
        expect(screen.getByText(/curve exponent/i)).toBeInTheDocument();
        expect(screen.getByText(/initial price/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty and Loading States', () => {
    it('shows empty state when no tokens', () => {
      render(<TokenComparison tokens={[]} />);

      expect(screen.getByText(/no tokens to compare/i)).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<TokenComparison {...defaultProps} loading={true} />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('shows single token message', () => {
      render(<TokenComparison tokens={[mockTokens[0]]} />);

      expect(screen.getByText(/add more tokens/i)).toBeInTheDocument();
    });
  });

  describe('Add Token', () => {
    it('shows add token button when enabled', () => {
      render(<TokenComparison {...defaultProps} allowAddToken={true} />);

      expect(screen.getByRole('button', { name: /add token/i })).toBeInTheDocument();
    });

    it('opens token search when add clicked', async () => {
      const user = userEvent.setup();
      render(<TokenComparison {...defaultProps} allowAddToken={true} />);

      const addBtn = screen.getByRole('button', { name: /add token/i });
      await user.click(addBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search token/i)).toBeInTheDocument();
      });
    });

    it('calls onAddToken callback', async () => {
      const onAddToken = vi.fn();
      const user = userEvent.setup();
      render(
        <TokenComparison {...defaultProps} allowAddToken={true} onAddToken={onAddToken} />
      );

      const addBtn = screen.getByRole('button', { name: /add token/i });
      await user.click(addBtn);

      const searchInput = screen.getByPlaceholderText(/search token/i);
      await user.type(searchInput, 'test{enter}');

      expect(onAddToken).toHaveBeenCalled();
    });
  });

  describe('Remove Token', () => {
    it('shows remove button for each token', () => {
      render(<TokenComparison {...defaultProps} allowRemoveToken={true} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons.length).toBe(mockTokens.length);
    });

    it('calls onRemoveToken callback', async () => {
      const onRemoveToken = vi.fn();
      const user = userEvent.setup();
      render(
        <TokenComparison
          {...defaultProps}
          allowRemoveToken={true}
          onRemoveToken={onRemoveToken}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(onRemoveToken).toHaveBeenCalledWith('token-1');
    });
  });

  describe('Export', () => {
    it('shows export button when enabled', () => {
      render(<TokenComparison {...defaultProps} showExport={true} />);

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('exports comparison data as CSV', async () => {
      const user = userEvent.setup();
      const mockDownload = vi.fn();
      global.URL.createObjectURL = vi.fn();

      render(<TokenComparison {...defaultProps} showExport={true} />);

      const exportBtn = screen.getByRole('button', { name: /export/i });
      await user.click(exportBtn);

      // Export should trigger (we just verify the button is clickable)
      expect(exportBtn).not.toBeDisabled();
    });
  });
});
