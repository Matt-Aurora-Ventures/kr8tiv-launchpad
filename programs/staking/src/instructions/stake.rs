use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{StakePool, UserStake, StakingTier};
use crate::errors::StakingError;
use crate::{update_rewards, calculate_weight_multiplier, calculate_tier};

/// Stake tokens instruction
#[derive(Accounts)]
pub struct Stake<'info> {
    /// User staking tokens
    #[account(mut)]
    pub user: Signer<'info>,

    /// The stake pool
    #[account(
        mut,
        seeds = [StakePool::SEED_PREFIX, stake_pool.stake_mint.as_ref()],
        bump = stake_pool.bump
    )]
    pub stake_pool: Account<'info, StakePool>,

    /// User's stake account (created if doesn't exist)
    #[account(
        init_if_needed,
        payer = user,
        space = UserStake::LEN,
        seeds = [UserStake::SEED_PREFIX, stake_pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    /// User's token account to stake from
    #[account(
        mut,
        constraint = user_token_account.mint == stake_pool.stake_mint @ StakingError::InvalidMint,
        constraint = user_token_account.owner == user.key() @ StakingError::InvalidAuthority
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// Pool's stake vault
    #[account(
        mut,
        constraint = stake_vault.key() == stake_pool.stake_vault @ StakingError::InvalidMint
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Event emitted when tokens are staked
#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub stake_pool: Pubkey,
    pub amount: u64,
    pub weighted_amount: u64,
    pub lock_duration: i64,
    pub lock_end_time: i64,
    pub new_tier: StakingTier,
    pub total_staked: u64,
    pub timestamp: i64,
}

pub fn handler(ctx: Context<Stake>, amount: u64, lock_duration: i64) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;

    // Validate inputs
    require!(!stake_pool.paused, StakingError::PoolPaused);
    require!(amount > 0, StakingError::InvalidAmount);
    require!(
        lock_duration >= stake_pool.min_lock_duration,
        StakingError::DurationTooShort
    );
    require!(
        lock_duration <= stake_pool.max_lock_duration,
        StakingError::DurationTooLong
    );

    // Update accumulated rewards before changing stakes
    update_rewards(stake_pool, clock.unix_timestamp)?;

    // Calculate weight multiplier based on lock duration
    let weight_multiplier = calculate_weight_multiplier(
        lock_duration,
        stake_pool.min_lock_duration,
        stake_pool.max_lock_duration,
    );

    // weighted_amount = amount * multiplier / 10000
    let weighted_amount = (amount as u128)
        .checked_mul(weight_multiplier as u128)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(10000)
        .ok_or(StakingError::MathOverflow)? as u64;

    // Initialize user stake if first time
    let is_first_stake = user_stake.staked_amount == 0;

    if is_first_stake {
        user_stake.owner = ctx.accounts.user.key();
        user_stake.stake_pool = stake_pool.key();
        user_stake.stake_start_time = clock.unix_timestamp;
        user_stake.bump = ctx.bumps.user_stake;
        user_stake.lock_duration = lock_duration;
        user_stake.lock_end_time = clock.unix_timestamp
            .checked_add(lock_duration)
            .ok_or(StakingError::MathOverflow)?;
    } else {
        // For additional stakes, extend lock if new duration is longer
        let new_lock_end = clock.unix_timestamp
            .checked_add(lock_duration)
            .ok_or(StakingError::MathOverflow)?;

        if new_lock_end > user_stake.lock_end_time {
            user_stake.lock_end_time = new_lock_end;
            user_stake.lock_duration = lock_duration;
        }
    }

    // Update user stake amounts
    user_stake.staked_amount = user_stake.staked_amount
        .checked_add(amount)
        .ok_or(StakingError::MathOverflow)?;
    user_stake.weighted_stake = user_stake.weighted_stake
        .checked_add(weighted_amount)
        .ok_or(StakingError::MathOverflow)?;

    // Update reward debt for new stake
    // reward_debt += weighted_amount * accumulated_reward_per_share / 1e12
    let additional_debt = (weighted_amount as u128)
        .checked_mul(stake_pool.accumulated_reward_per_share)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(1_000_000_000_000)
        .ok_or(StakingError::MathOverflow)?;

    user_stake.reward_debt = user_stake.reward_debt
        .checked_add(additional_debt)
        .ok_or(StakingError::MathOverflow)?;

    // Update pool totals
    stake_pool.total_staked = stake_pool.total_staked
        .checked_add(amount)
        .ok_or(StakingError::MathOverflow)?;
    stake_pool.total_weighted_stake = stake_pool.total_weighted_stake
        .checked_add(weighted_amount)
        .ok_or(StakingError::MathOverflow)?;

    // Transfer tokens to vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.stake_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Calculate new tier
    let new_tier = calculate_tier(user_stake.staked_amount);

    // Emit event
    emit!(StakeEvent {
        user: ctx.accounts.user.key(),
        stake_pool: stake_pool.key(),
        amount,
        weighted_amount,
        lock_duration,
        lock_end_time: user_stake.lock_end_time,
        new_tier,
        total_staked: user_stake.staked_amount,
        timestamp: clock.unix_timestamp,
    });

    msg!("Staked {} tokens with {} weighted stake", amount, weighted_amount);
    msg!("Lock ends at: {}", user_stake.lock_end_time);
    msg!("New tier: {:?}", new_tier);

    Ok(())
}
