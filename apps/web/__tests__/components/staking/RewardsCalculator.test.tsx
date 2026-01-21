/**
 * Tests for the staking rewards calculator.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { RewardsCalculator } from '@/components/staking/RewardsCalculator';
import { LOCK_DURATIONS } from '@/lib/constants';

vi.mock('@/lib/api', () => ({
  stakingApi: {
    getPool: vi.fn().mockResolvedValue({
      totalStaked: 1000000,
      totalStakers: 500,
      rewardRate: 0.1,
      apr: 15,
    }),
  },
}));

describe('RewardsCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the calculator inputs', () => {
    render(<RewardsCalculator />);

    expect(screen.getByLabelText(/stake amount/i)).toBeInTheDocument();
    expect(screen.getByText(/lock duration/i)).toBeInTheDocument();
  });

  it('shows the default stake amount', () => {
    render(<RewardsCalculator />);

    const input = screen.getByLabelText(/stake amount/i) as HTMLInputElement;
    expect(input.value).toBe('10000');
  });

  it('updates amount when user types', async () => {
    const user = userEvent.setup();
    render(<RewardsCalculator />);

    const input = screen.getByLabelText(/stake amount/i);
    await user.clear(input);
    await user.type(input, '25000');

    expect(input).toHaveValue(25000);
  });

  it('shows all lock duration options', () => {
    render(<RewardsCalculator />);

    LOCK_DURATIONS.forEach((duration) => {
      expect(screen.getByText(duration.label)).toBeInTheDocument();
    });
  });

  it('updates effective stake when lock duration changes', async () => {
    const user = userEvent.setup();
    render(<RewardsCalculator />);

    await user.click(screen.getByText('3 Months'));

    expect(screen.getByTestId('effective-stake')).toHaveTextContent('15,000');
  });

  it('updates tier badge based on stake amount', async () => {
    const user = userEvent.setup();
    render(<RewardsCalculator />);

    const input = screen.getByLabelText(/stake amount/i);
    await user.clear(input);
    await user.type(input, '1000');
    expect(screen.getByTestId('current-tier')).toHaveTextContent(/holder/i);

    await user.clear(input);
    await user.type(input, '10000');
    expect(screen.getByTestId('current-tier')).toHaveTextContent(/premium/i);

    await user.clear(input);
    await user.type(input, '100000');
    expect(screen.getByTestId('current-tier')).toHaveTextContent(/vip/i);
  });

  it('shows effective platform fee per tier', async () => {
    const user = userEvent.setup();
    render(<RewardsCalculator />);

    const input = screen.getByLabelText(/stake amount/i);
    await user.clear(input);
    await user.type(input, '0');
    expect(screen.getByTestId('fee-discount')).toHaveTextContent('5.00%');

    await user.clear(input);
    await user.type(input, '1000');
    expect(screen.getByTestId('fee-discount')).toHaveTextContent('4.00%');

    await user.clear(input);
    await user.type(input, '10000');
    expect(screen.getByTestId('fee-discount')).toHaveTextContent('2.00%');

    await user.clear(input);
    await user.type(input, '100000');
    expect(screen.getByTestId('fee-discount')).toHaveTextContent('0.00%');
  });

  it('renders projected rewards for all periods', () => {
    render(<RewardsCalculator />);

    expect(screen.getByTestId('daily-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('yearly-rewards')).toBeInTheDocument();
  });
});
