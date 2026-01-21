use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{StakePool, UserStake, StakingTier};
use crate::errors::StakingError;
use crate::{update_rewards, calculate_pending_rewards, calculate_tier};

/// Claim rewards instruction
#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    /// User claiming rewards
    #[account(mut)]
    pub user: Signer<'info>,

    /// The stake pool
    #[account(
        mut,
        seeds = [StakePool::SEED_PREFIX, stake_pool.stake_mint.as_ref()],
        bump = stake_pool.bump
    )]
    pub stake_pool: Account<'info, StakePool>,

    /// User's stake account
    #[account(
        mut,
        seeds = [UserStake::SEED_PREFIX, stake_pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump,
        constraint = user_stake.owner == user.key() @ StakingError::InvalidAuthority
    )]
    pub user_stake: Account<'info, UserStake>,

    /// User's reward token account
    #[account(
        mut,
        constraint = user_reward_account.mint == stake_pool.reward_mint @ StakingError::InvalidMint,
        constraint = user_reward_account.owner == user.key() @ StakingError::InvalidAuthority
    )]
    pub user_reward_account: Account<'info, TokenAccount>,

    /// Pool's reward vault
    #[account(
        mut,
        constraint = reward_vault.key() == stake_pool.reward_vault @ StakingError::InvalidMint
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Event emitted when rewards are claimed
#[event]
pub struct ClaimEvent {
    pub user: Pubkey,
    pub stake_pool: Pubkey,
    pub amount: u64,
    pub tier: StakingTier,
    pub tier_multiplier_applied: u64,
    pub total_claimed: u64,
    pub timestamp: i64,
}

pub fn handler(ctx: Context<ClaimRewards>) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;

    // Validate user has stake
    require!(user_stake.staked_amount > 0, StakingError::InsufficientStake);

    // Update accumulated rewards
    update_rewards(stake_pool, clock.unix_timestamp)?;

    // Calculate pending rewards
    let pending = calculate_pending_rewards(user_stake, stake_pool.accumulated_reward_per_share)?;

    require!(pending > 0, StakingError::NoPendingRewards);

    // Get user's tier and apply multiplier
    let tier = calculate_tier(user_stake.staked_amount);
    let tier_multiplier = tier.reward_multiplier_bps();

    // Apply tier multiplier: reward_with_bonus = pending * multiplier / 10000
    let reward_amount = (pending as u128)
        .checked_mul(tier_multiplier as u128)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(10000)
        .ok_or(StakingError::MathOverflow)? as u64;

    // Check vault has sufficient balance
    let vault_balance = ctx.accounts.reward_vault.amount;
    let actual_reward = reward_amount.min(vault_balance);

    require!(actual_reward > 0, StakingError::NoPendingRewards);

    // Update reward debt to current accumulation
    // reward_debt = weighted_stake * accumulated_reward_per_share / 1e12
    user_stake.reward_debt = (user_stake.weighted_stake as u128)
        .checked_mul(stake_pool.accumulated_reward_per_share)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(1_000_000_000_000)
        .ok_or(StakingError::MathOverflow)?;

    // Update total claimed
    user_stake.total_claimed = user_stake.total_claimed
        .checked_add(actual_reward)
        .ok_or(StakingError::MathOverflow)?;

    // Transfer rewards to user via PDA signer
    let stake_mint_key = stake_pool.stake_mint;
    let pool_bump = stake_pool.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        StakePool::SEED_PREFIX,
        stake_mint_key.as_ref(),
        &[pool_bump],
    ]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_reward_account.to_account_info(),
            authority: stake_pool.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, actual_reward)?;

    // Emit event
    emit!(ClaimEvent {
        user: ctx.accounts.user.key(),
        stake_pool: stake_pool.key(),
        amount: actual_reward,
        tier,
        tier_multiplier_applied: tier_multiplier,
        total_claimed: user_stake.total_claimed,
        timestamp: clock.unix_timestamp,
    });

    msg!("Claimed {} reward tokens", actual_reward);
    msg!("Tier: {:?} ({}x multiplier)", tier, tier_multiplier as f64 / 10000.0);
    msg!("Total claimed to date: {}", user_stake.total_claimed);

    Ok(())
}
