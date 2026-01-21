use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::StakePool;
use crate::errors::StakingError;

/// Initialize a new staking pool
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Authority who will manage the stake pool
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The stake pool account to initialize
    #[account(
        init,
        payer = authority,
        space = StakePool::LEN,
        seeds = [StakePool::SEED_PREFIX, stake_mint.key().as_ref()],
        bump
    )]
    pub stake_pool: Account<'info, StakePool>,

    /// The token mint for staking (KR8TIV token)
    pub stake_mint: Account<'info, Mint>,

    /// The token mint for rewards
    pub reward_mint: Account<'info, Mint>,

    /// Vault to hold staked tokens
    #[account(
        init,
        payer = authority,
        token::mint = stake_mint,
        token::authority = stake_pool,
        seeds = [b"stake_vault", stake_pool.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    /// Vault to hold reward tokens
    #[account(
        init,
        payer = authority,
        token::mint = reward_mint,
        token::authority = stake_pool,
        seeds = [b"reward_vault", stake_pool.key().as_ref()],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

/// Parameters for initializing a stake pool
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    /// Reward rate per second
    pub reward_rate: u64,
    /// Minimum lock duration in seconds (default: 7 days)
    pub min_lock_duration: i64,
    /// Maximum lock duration in seconds (default: 365 days)
    pub max_lock_duration: i64,
}

pub fn handler(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    // Validate durations
    require!(
        params.min_lock_duration >= 0,
        StakingError::DurationTooShort
    );
    require!(
        params.max_lock_duration >= params.min_lock_duration,
        StakingError::DurationTooLong
    );

    let stake_pool = &mut ctx.accounts.stake_pool;
    let clock = Clock::get()?;

    stake_pool.authority = ctx.accounts.authority.key();
    stake_pool.stake_mint = ctx.accounts.stake_mint.key();
    stake_pool.reward_mint = ctx.accounts.reward_mint.key();
    stake_pool.stake_vault = ctx.accounts.stake_vault.key();
    stake_pool.reward_vault = ctx.accounts.reward_vault.key();
    stake_pool.total_staked = 0;
    stake_pool.total_weighted_stake = 0;
    stake_pool.reward_rate = params.reward_rate;
    stake_pool.accumulated_reward_per_share = 0;
    stake_pool.last_reward_time = clock.unix_timestamp;
    stake_pool.min_lock_duration = params.min_lock_duration;
    stake_pool.max_lock_duration = params.max_lock_duration;
    stake_pool.paused = false;
    stake_pool.bump = ctx.bumps.stake_pool;

    msg!("Stake pool initialized");
    msg!("Authority: {}", stake_pool.authority);
    msg!("Stake mint: {}", stake_pool.stake_mint);
    msg!("Reward rate: {} per second", stake_pool.reward_rate);

    Ok(())
}
