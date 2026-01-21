/**
 * Tests for Staking Rewards Calculator Components
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Components under test (to be implemented)
import { RewardsCalculator } from '@/components/staking/RewardsCalculator';
import { TierComparison } from '@/components/staking/TierComparison';
import { LockDurationSelector } from '@/components/staking/LockDurationSelector';
import { ProjectedRewards } from '@/components/staking/ProjectedRewards';

// Constants
import { STAKING_TIERS, LOCK_DURATIONS } from '@/lib/constants';

// Mock the API
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

  describe('rendering', () => {
    it('should render the calculator with all inputs', () => {
      render(<RewardsCalculator />);

      expect(screen.getByLabelText(/stake amount/i)).toBeInTheDocument();
      expect(screen.getByText(/lock duration/i)).toBeInTheDocument();
    });

    it('should display initial values correctly', () => {
      render(<RewardsCalculator initialAmount={5000} />);

      const input = screen.getByLabelText(/stake amount/i) as HTMLInputElement;
      expect(input.value).toBe('5000');
    });

    it('should display tier information based on stake amount', () => {
      render(<RewardsCalculator initialAmount={50000} />);

      expect(screen.getByText(/premium/i)).toBeInTheDocument();
    });
  });

  describe('stake amount input', () => {
    it('should update amount when user types', async () => {
      const user = userEvent.setup();
      render(<RewardsCalculator />);

      const input = screen.getByLabelText(/stake amount/i);
      await user.clear(input);
      await user.type(input, '10000');

      expect(input).toHaveValue(10000);
    });

    it('should calculate effective stake based on lock duration', async () => {
      render(<RewardsCalculator initialAmount={10000} initialLockDays={90} />);

      // 90 days = 1.5x multiplier, 10000 * 1.5 = 15000
      expect(screen.getByTestId('effective-stake')).toHaveTextContent('15,000');
    });

    it('should handle max button click', async () => {
      const user = userEvent.setup();
      render(<RewardsCalculator maxBalance={100000} />);

      const maxButton = screen.getByRole('button', { name: /max/i });
      await user.click(maxButton);

      const input = screen.getByLabelText(/stake amount/i);
      expect(input).toHaveValue(100000);
    });
  });

  describe('lock duration selector', () => {
    it('should show all duration options', () => {
      render(<RewardsCalculator />);

      LOCK_DURATIONS.forEach((duration) => {
        expect(screen.getByText(duration.label)).toBeInTheDocument();
      });
    });

    it('should update multiplier display when duration changes', async () => {
      const user = userEvent.setup();
      render(<RewardsCalculator />);

      const yearOption = screen.getByText('1 Year');
      await user.click(yearOption);

      expect(screen.getByText(/3x/)).toBeInTheDocument();
    });
  });

  describe('tier display', () => {
    it('should show None tier for stake below 1000', () => {
      render(<RewardsCalculator initialAmount={500} initialLockDays={7} />);
      expect(screen.getByTestId('current-tier')).toHaveTextContent(/none/i);
    });

    it('should show Holder tier for 1000+ KR8TIV', () => {
      render(<RewardsCalculator initialAmount={1000} initialLockDays={7} />);
      expect(screen.getByTestId('current-tier')).toHaveTextContent(/holder/i);
    });

    it('should show Premium tier for 10000+ KR8TIV', () => {
      render(<RewardsCalculator initialAmount={10000} initialLockDays={7} />);
      expect(screen.getByTestId('current-tier')).toHaveTextContent(/premium/i);
    });

    it('should show VIP tier for 100000+ KR8TIV', () => {
      render(<RewardsCalculator initialAmount={100000} initialLockDays={7} />);
      expect(screen.getByTestId('current-tier')).toHaveTextContent(/vip/i);
    });

    it('should account for multiplier when calculating tier', () => {
      // 40000 * 3.0 (365 days) = 120000 = VIP
      render(<RewardsCalculator initialAmount={40000} initialLockDays={365} />);
      expect(screen.getByTestId('current-tier')).toHaveTextContent(/vip/i);
    });
  });

  describe('projected rewards', () => {
    it('should display projected rewards for all time periods', () => {
      render(<RewardsCalculator initialAmount={10000} initialLockDays={30} apr={15} />);

      expect(screen.getByTestId('daily-rewards')).toBeInTheDocument();
      expect(screen.getByTestId('weekly-rewards')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-rewards')).toBeInTheDocument();
      expect(screen.getByTestId('yearly-rewards')).toBeInTheDocument();
    });
  });

  describe('fee discount display', () => {
    it('should show 0% discount for None tier', () => {
      render(<RewardsCalculator initialAmount={0} />);
      expect(screen.getByTestId('fee-discount')).toHaveTextContent('0%');
    });

    it('should show 10% discount for Holder tier', () => {
      render(<RewardsCalculator initialAmount={1000} initialLockDays={7} />);
      expect(screen.getByTestId('fee-discount')).toHaveTextContent('10%');
    });

    it('should show 25% discount for Premium tier', () => {
      render(<RewardsCalculator initialAmount={10000} initialLockDays={7} />);
      expect(screen.getByTestId('fee-discount')).toHaveTextContent('25%');
    });

    it('should show 50% discount for VIP tier', () => {
      render(<RewardsCalculator initialAmount={100000} initialLockDays={7} />);
      expect(screen.getByTestId('fee-discount')).toHaveTextContent('50%');
    });
  });

  describe('what-if scenarios', () => {
    it('should allow adding comparison scenarios', async () => {
      const user = userEvent.setup();
      render(<RewardsCalculator showWhatIf />);

      const addButton = screen.getByRole('button', { name: /add scenario/i });
      await user.click(addButton);

      expect(screen.getByTestId('scenario-1')).toBeInTheDocument();
    });
  });
});

describe('TierComparison', () => {
  it('should render all tiers', () => {
    render(<TierComparison currentEffectiveStake={5000} />);

    Object.values(STAKING_TIERS).forEach((tier) => {
      expect(screen.getByText(tier.name)).toBeInTheDocument();
    });
  });

  it('should highlight the current tier', () => {
    render(<TierComparison currentEffectiveStake={5000} />);

    const holderRow = screen.getByTestId('tier-row-HOLDER');
    expect(holderRow).toHaveClass('border-primary');
  });

  it('should show amount needed for next tier', () => {
    render(<TierComparison currentEffectiveStake={5000} />);

    // Need 5000 more to reach Premium (10000 - 5000)
    expect(screen.getByText(/5,000 more/i)).toBeInTheDocument();
  });

  it('should show tier discounts', () => {
    render(<TierComparison currentEffectiveStake={0} />);

    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });
});

describe('LockDurationSelector', () => {
  it('should render all duration options', () => {
    const onChange = vi.fn();
    render(<LockDurationSelector selectedDays={7} onChange={onChange} />);

    LOCK_DURATIONS.forEach((duration) => {
      expect(screen.getByText(duration.label)).toBeInTheDocument();
    });
  });

  it('should call onChange when duration is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LockDurationSelector selectedDays={7} onChange={onChange} />);

    await user.click(screen.getByText('1 Year'));

    expect(onChange).toHaveBeenCalledWith(365);
  });

  it('should show multiplier for each duration', () => {
    const onChange = vi.fn();
    render(<LockDurationSelector selectedDays={7} onChange={onChange} />);

    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
  });

  it('should highlight selected duration', () => {
    const onChange = vi.fn();
    render(<LockDurationSelector selectedDays={90} onChange={onChange} />);

    const selectedButton = screen.getByText('3 Months').closest('button');
    expect(selectedButton).toHaveClass('border-primary');
  });
});

describe('ProjectedRewards', () => {
  it('should display projected rewards for all time periods', () => {
    render(<ProjectedRewards effectiveStake={10000} apr={15} />);

    expect(screen.getByTestId('daily-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-rewards')).toBeInTheDocument();
    expect(screen.getByTestId('yearly-rewards')).toBeInTheDocument();
  });

  it('should calculate correct daily reward amount', () => {
    // 10000 * 0.15 / 365 = ~4.11 daily
    render(<ProjectedRewards effectiveStake={10000} apr={15} />);

    const dailyRewards = screen.getByTestId('daily-rewards');
    expect(dailyRewards.textContent).toMatch(/4\./);
  });

  it('should handle zero stake gracefully', () => {
    render(<ProjectedRewards effectiveStake={0} apr={15} />);

    const dailyRewards = screen.getByTestId('daily-rewards');
    expect(dailyRewards.textContent).toMatch(/0/);
  });

  it('should display rewards chart when showChart is true', () => {
    render(<ProjectedRewards effectiveStake={10000} apr={15} showChart />);

    expect(screen.getByTestId('rewards-chart')).toBeInTheDocument();
  });
});
