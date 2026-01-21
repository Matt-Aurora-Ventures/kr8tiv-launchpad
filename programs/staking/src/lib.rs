use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;
use errors::StakingError;

declare_id!("KR8TivStake1111111111111111111111111111111");

/// Constants for staking calculations
pub mod constants {
    /// Minimum lock duration: 7 days in seconds
    pub const MIN_LOCK_DURATION: i64 = 7 * 24 * 60 * 60; // 604,800 seconds

    /// Maximum lock duration: 365 days in seconds
    pub const MAX_LOCK_DURATION: i64 = 365 * 24 * 60 * 60; // 31,536,000 seconds

    /// Precision multiplier for accumulated rewards (1e12)
    pub const PRECISION: u128 = 1_000_000_000_000;

    /// Basis points denominator (10000 = 100%)
    pub const BPS_DENOMINATOR: u64 = 10000;

    /// Minimum weight multiplier (1x = 10000 bps)
    pub const MIN_WEIGHT_MULTIPLIER: u64 = 10000;

    /// Maximum weight multiplier (2x = 20000 bps)
    pub const MAX_WEIGHT_MULTIPLIER: u64 = 20000;

    /// Tier thresholds (in token smallest units, assuming 9 decimals)
    pub const HOLDER_THRESHOLD: u64 = 1_000_000_000_000;     // 1,000 tokens
    pub const PREMIUM_THRESHOLD: u64 = 10_000_000_000_000;   // 10,000 tokens
    pub const VIP_THRESHOLD: u64 = 100_000_000_000_000;      // 100,000 tokens
}

#[program]
pub mod staking {
    use super::*;

    /// Initialize a new staking pool
    ///
    /// # Arguments
    /// * `ctx` - Initialize context
    /// * `params` - Initialization parameters including reward rate and lock durations
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::initialize::handler(ctx, params)
    }

    /// Stake tokens into the pool
    ///
    /// # Arguments
    /// * `ctx` - Stake context
    /// * `amount` - Amount of tokens to stake
    /// * `lock_duration` - Lock duration in seconds (must be between min and max)
    pub fn stake(ctx: Context<Stake>, amount: u64, lock_duration: i64) -> Result<()> {
        instructions::stake::handler(ctx, amount, lock_duration)
    }

    /// Unstake tokens from the pool (only after lock period ends)
    ///
    /// # Arguments
    /// * `ctx` - Unstake context
    /// * `amount` - Amount of tokens to unstake
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        instructions::unstake::handler(ctx, amount)
    }

    /// Claim pending rewards
    ///
    /// # Arguments
    /// * `ctx` - ClaimRewards context
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        instructions::claim_rewards::handler(ctx)
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Calculate the staking tier based on staked amount
///
/// # Arguments
/// * `staked_amount` - Total tokens staked by user
///
/// # Returns
/// * `StakingTier` - The user's tier based on their stake
pub fn calculate_tier(staked_amount: u64) -> StakingTier {
    if staked_amount >= constants::VIP_THRESHOLD {
        StakingTier::Vip
    } else if staked_amount >= constants::PREMIUM_THRESHOLD {
        StakingTier::Premium
    } else if staked_amount >= constants::HOLDER_THRESHOLD {
        StakingTier::Holder
    } else {
        StakingTier::None
    }
}

/// Get platform fee in basis points for a given tier
///
/// # Arguments
/// * `tier` - The staking tier
///
/// # Returns
/// * `u16` - Fee in basis points (500 = 5%, 400 = 4%, 200 = 2%, 0 = 0%)
pub fn get_platform_fee(tier: StakingTier) -> u16 {
    tier.platform_fee_bps()
}

/// Get reward multiplier in basis points for a given tier
///
/// # Arguments
/// * `tier` - The staking tier
///
/// # Returns
/// * `u64` - Multiplier in basis points (10000 = 1x, 15000 = 1.5x)
pub fn get_reward_multiplier(tier: StakingTier) -> u64 {
    tier.reward_multiplier_bps()
}

/// Calculate weight multiplier based on lock duration
/// Linear interpolation from 1x (min duration) to 2x (max duration)
///
/// # Arguments
/// * `lock_duration` - Chosen lock duration in seconds
/// * `min_duration` - Minimum allowed lock duration
/// * `max_duration` - Maximum allowed lock duration
///
/// # Returns
/// * `u64` - Weight multiplier in basis points (10000 = 1x, 20000 = 2x)
pub fn calculate_weight_multiplier(
    lock_duration: i64,
    min_duration: i64,
    max_duration: i64,
) -> u64 {
    // Clamp duration to valid range
    let duration = lock_duration.max(min_duration).min(max_duration);

    // Calculate how far through the range we are (0 to 10000)
    let range = max_duration - min_duration;
    if range == 0 {
        return constants::MIN_WEIGHT_MULTIPLIER;
    }

    let progress = duration - min_duration;
    let progress_bps = ((progress as u128) * 10000 / (range as u128)) as u64;

    // Linear interpolation: min_mult + (max_mult - min_mult) * progress / 10000
    let multiplier_range = constants::MAX_WEIGHT_MULTIPLIER - constants::MIN_WEIGHT_MULTIPLIER;
    constants::MIN_WEIGHT_MULTIPLIER + (multiplier_range * progress_bps / 10000)
}

/// Update the accumulated rewards per share for a stake pool
/// Must be called before any stake/unstake/claim operation
///
/// # Arguments
/// * `stake_pool` - Mutable reference to the stake pool
/// * `current_time` - Current Unix timestamp
///
/// # Returns
/// * `Result<()>` - Success or error
pub fn update_rewards(stake_pool: &mut StakePool, current_time: i64) -> Result<()> {
    if stake_pool.total_weighted_stake == 0 {
        stake_pool.last_reward_time = current_time;
        return Ok(());
    }

    let time_elapsed = current_time
        .checked_sub(stake_pool.last_reward_time)
        .ok_or(StakingError::MathOverflow)?;

    if time_elapsed <= 0 {
        return Ok(());
    }

    // Calculate new rewards: time_elapsed * reward_rate
    let new_rewards = (time_elapsed as u128)
        .checked_mul(stake_pool.reward_rate as u128)
        .ok_or(StakingError::MathOverflow)?;

    // Update accumulated reward per share
    // acc_reward_per_share += (new_rewards * PRECISION) / total_weighted_stake
    let reward_per_share_increase = new_rewards
        .checked_mul(constants::PRECISION)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(stake_pool.total_weighted_stake as u128)
        .ok_or(StakingError::MathOverflow)?;

    stake_pool.accumulated_reward_per_share = stake_pool
        .accumulated_reward_per_share
        .checked_add(reward_per_share_increase)
        .ok_or(StakingError::MathOverflow)?;

    stake_pool.last_reward_time = current_time;

    Ok(())
}

/// Calculate pending rewards for a user stake
///
/// # Arguments
/// * `user_stake` - Reference to the user's stake account
/// * `accumulated_reward_per_share` - Current accumulated reward per share from pool
///
/// # Returns
/// * `Result<u64>` - Pending reward amount
pub fn calculate_pending_rewards(
    user_stake: &UserStake,
    accumulated_reward_per_share: u128,
) -> Result<u64> {
    if user_stake.weighted_stake == 0 {
        return Ok(0);
    }

    // pending = (weighted_stake * acc_reward_per_share / PRECISION) - reward_debt
    let accumulated = (user_stake.weighted_stake as u128)
        .checked_mul(accumulated_reward_per_share)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(constants::PRECISION)
        .ok_or(StakingError::MathOverflow)?;

    let pending = accumulated
        .checked_sub(user_stake.reward_debt)
        .unwrap_or(0);

    // Safe to cast as rewards should never exceed u64 in practice
    Ok(pending.min(u64::MAX as u128) as u64)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_tier() {
        // Less than 1,000 tokens (with 9 decimals)
        assert_eq!(calculate_tier(999_000_000_000), StakingTier::None);

        // Exactly 1,000 tokens
        assert_eq!(calculate_tier(1_000_000_000_000), StakingTier::Holder);

        // Between 1,000 and 10,000
        assert_eq!(calculate_tier(5_000_000_000_000), StakingTier::Holder);

        // Exactly 10,000 tokens
        assert_eq!(calculate_tier(10_000_000_000_000), StakingTier::Premium);

        // Between 10,000 and 100,000
        assert_eq!(calculate_tier(50_000_000_000_000), StakingTier::Premium);

        // Exactly 100,000 tokens
        assert_eq!(calculate_tier(100_000_000_000_000), StakingTier::Vip);

        // More than 100,000
        assert_eq!(calculate_tier(500_000_000_000_000), StakingTier::Vip);
    }

    #[test]
    fn test_tier_fees() {
        assert_eq!(StakingTier::None.platform_fee_bps(), 500);    // 5%
        assert_eq!(StakingTier::Holder.platform_fee_bps(), 400);  // 4%
        assert_eq!(StakingTier::Premium.platform_fee_bps(), 200); // 2%
        assert_eq!(StakingTier::Vip.platform_fee_bps(), 0);       // 0%
    }

    #[test]
    fn test_tier_multipliers() {
        assert_eq!(StakingTier::None.reward_multiplier_bps(), 10000);    // 1.0x
        assert_eq!(StakingTier::Holder.reward_multiplier_bps(), 11000);  // 1.1x
        assert_eq!(StakingTier::Premium.reward_multiplier_bps(), 12500); // 1.25x
        assert_eq!(StakingTier::Vip.reward_multiplier_bps(), 15000);     // 1.5x
    }

    #[test]
    fn test_weight_multiplier() {
        let min_duration = constants::MIN_LOCK_DURATION; // 7 days
        let max_duration = constants::MAX_LOCK_DURATION; // 365 days

        // Minimum duration should give 1x (10000 bps)
        let mult_min = calculate_weight_multiplier(min_duration, min_duration, max_duration);
        assert_eq!(mult_min, 10000);

        // Maximum duration should give 2x (20000 bps)
        let mult_max = calculate_weight_multiplier(max_duration, min_duration, max_duration);
        assert_eq!(mult_max, 20000);

        // Middle duration should give approximately 1.5x
        let mid_duration = (min_duration + max_duration) / 2;
        let mult_mid = calculate_weight_multiplier(mid_duration, min_duration, max_duration);
        // Should be close to 15000 (1.5x)
        assert!(mult_mid >= 14900 && mult_mid <= 15100);

        // Below minimum should be clamped to 1x
        let mult_below = calculate_weight_multiplier(0, min_duration, max_duration);
        assert_eq!(mult_below, 10000);

        // Above maximum should be clamped to 2x
        let mult_above = calculate_weight_multiplier(max_duration * 2, min_duration, max_duration);
        assert_eq!(mult_above, 20000);
    }

    #[test]
    fn test_get_platform_fee() {
        assert_eq!(get_platform_fee(StakingTier::None), 500);
        assert_eq!(get_platform_fee(StakingTier::Holder), 400);
        assert_eq!(get_platform_fee(StakingTier::Premium), 200);
        assert_eq!(get_platform_fee(StakingTier::Vip), 0);
    }

    #[test]
    fn test_get_reward_multiplier() {
        assert_eq!(get_reward_multiplier(StakingTier::None), 10000);
        assert_eq!(get_reward_multiplier(StakingTier::Holder), 11000);
        assert_eq!(get_reward_multiplier(StakingTier::Premium), 12500);
        assert_eq!(get_reward_multiplier(StakingTier::Vip), 15000);
    }
}
