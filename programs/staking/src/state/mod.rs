use anchor_lang::prelude::*;

/// Staking tier based on amount staked
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum StakingTier {
    /// No tier - less than 1,000 tokens (5% platform fee)
    None,
    /// Holder tier - 1,000+ tokens (4% platform fee)
    Holder,
    /// Premium tier - 10,000+ tokens (2% platform fee)
    Premium,
    /// VIP tier - 100,000+ tokens (0% platform fee)
    Vip,
}

impl Default for StakingTier {
    fn default() -> Self {
        StakingTier::None
    }
}

impl StakingTier {
    /// Get the platform fee percentage (in basis points) for this tier
    /// 500 = 5%, 400 = 4%, 200 = 2%, 0 = 0%
    pub fn platform_fee_bps(&self) -> u16 {
        match self {
            StakingTier::None => 500,    // 5%
            StakingTier::Holder => 400,  // 4%
            StakingTier::Premium => 200, // 2%
            StakingTier::Vip => 0,       // 0%
        }
    }

    /// Get the reward multiplier for this tier (in basis points)
    /// 10000 = 1x, 11000 = 1.1x, 12500 = 1.25x, 15000 = 1.5x
    pub fn reward_multiplier_bps(&self) -> u64 {
        match self {
            StakingTier::None => 10000,    // 1.0x
            StakingTier::Holder => 11000,  // 1.1x
            StakingTier::Premium => 12500, // 1.25x
            StakingTier::Vip => 15000,     // 1.5x
        }
    }
}

/// Stake pool configuration and state
#[account]
#[derive(Default)]
pub struct StakePool {
    /// Authority that can manage this pool
    pub authority: Pubkey,

    /// The token mint for staking (KR8TIV token)
    pub stake_mint: Pubkey,

    /// The token mint for rewards (can be same as stake_mint or different)
    pub reward_mint: Pubkey,

    /// Vault holding staked tokens
    pub stake_vault: Pubkey,

    /// Vault holding reward tokens
    pub reward_vault: Pubkey,

    /// Total tokens staked in the pool
    pub total_staked: u64,

    /// Total weighted stake (accounts for lock duration multipliers)
    pub total_weighted_stake: u64,

    /// Reward rate per second (in token smallest units)
    pub reward_rate: u64,

    /// Accumulated reward per share (scaled by 1e12 for precision)
    pub accumulated_reward_per_share: u128,

    /// Last timestamp when rewards were updated
    pub last_reward_time: i64,

    /// Minimum lock duration in seconds (default: 7 days = 604800)
    pub min_lock_duration: i64,

    /// Maximum lock duration in seconds (default: 365 days = 31536000)
    pub max_lock_duration: i64,

    /// Whether the pool is paused
    pub paused: bool,

    /// Bump seed for PDA derivation
    pub bump: u8,

    /// Reserved space for future upgrades
    pub _reserved: [u8; 64],
}

impl StakePool {
    pub const LEN: usize = 8 +  // discriminator
        32 +  // authority
        32 +  // stake_mint
        32 +  // reward_mint
        32 +  // stake_vault
        32 +  // reward_vault
        8 +   // total_staked
        8 +   // total_weighted_stake
        8 +   // reward_rate
        16 +  // accumulated_reward_per_share
        8 +   // last_reward_time
        8 +   // min_lock_duration
        8 +   // max_lock_duration
        1 +   // paused
        1 +   // bump
        64;   // _reserved

    pub const SEED_PREFIX: &'static [u8] = b"stake_pool";
}

/// Individual user stake account
#[account]
#[derive(Default)]
pub struct UserStake {
    /// Owner of this stake
    pub owner: Pubkey,

    /// The stake pool this belongs to
    pub stake_pool: Pubkey,

    /// Amount of tokens staked (raw, not weighted)
    pub staked_amount: u64,

    /// Weighted stake amount (includes lock duration multiplier)
    pub weighted_stake: u64,

    /// Unix timestamp when lock period ends
    pub lock_end_time: i64,

    /// Lock duration chosen (for recalculating on additional stakes)
    pub lock_duration: i64,

    /// Reward debt for calculating pending rewards
    /// reward_debt = weighted_stake * accumulated_reward_per_share at time of stake
    pub reward_debt: u128,

    /// Total rewards claimed by this user
    pub total_claimed: u64,

    /// Timestamp of first stake
    pub stake_start_time: i64,

    /// Bump seed for PDA derivation
    pub bump: u8,

    /// Reserved space for future upgrades
    pub _reserved: [u8; 32],
}

impl UserStake {
    pub const LEN: usize = 8 +  // discriminator
        32 +  // owner
        32 +  // stake_pool
        8 +   // staked_amount
        8 +   // weighted_stake
        8 +   // lock_end_time
        8 +   // lock_duration
        16 +  // reward_debt
        8 +   // total_claimed
        8 +   // stake_start_time
        1 +   // bump
        32;   // _reserved

    pub const SEED_PREFIX: &'static [u8] = b"user_stake";
}
