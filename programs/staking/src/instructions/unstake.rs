use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{StakePool, UserStake, StakingTier};
use crate::errors::StakingError;
use crate::{update_rewards, calculate_pending_rewards, calculate_tier};

/// Unstake tokens instruction
#[derive(Accounts)]
pub struct Unstake<'info> {
    /// User unstaking tokens
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

    /// User's token account to receive unstaked tokens
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
}

/// Event emitted when tokens are unstaked
#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub stake_pool: Pubkey,
    pub amount: u64,
    pub weighted_amount_removed: u64,
    pub remaining_stake: u64,
    pub new_tier: StakingTier,
    pub timestamp: i64,
}

pub fn handler(ctx: Context<Unstake>, amount: u64) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;

    // Validate inputs
    require!(amount > 0, StakingError::InvalidAmount);
    require!(
        user_stake.staked_amount >= amount,
        StakingError::InsufficientStake
    );
    require!(
        clock.unix_timestamp >= user_stake.lock_end_time,
        StakingError::StillLocked
    );

    // Update accumulated rewards before changing stakes
    update_rewards(stake_pool, clock.unix_timestamp)?;

    // Calculate proportional weighted stake to remove
    // weighted_to_remove = (amount / staked_amount) * weighted_stake
    let weighted_to_remove = (amount as u128)
        .checked_mul(user_stake.weighted_stake as u128)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(user_stake.staked_amount as u128)
        .ok_or(StakingError::MathOverflow)? as u64;

    // Calculate proportional reward debt to remove
    let debt_to_remove = (amount as u128)
        .checked_mul(user_stake.reward_debt)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(user_stake.staked_amount as u128)
        .ok_or(StakingError::MathOverflow)?;

    // Update user stake
    user_stake.staked_amount = user_stake.staked_amount
        .checked_sub(amount)
        .ok_or(StakingError::MathOverflow)?;
    user_stake.weighted_stake = user_stake.weighted_stake
        .checked_sub(weighted_to_remove)
        .ok_or(StakingError::MathOverflow)?;
    user_stake.reward_debt = user_stake.reward_debt
        .checked_sub(debt_to_remove)
        .ok_or(StakingError::MathOverflow)?;

    // Update pool totals
    stake_pool.total_staked = stake_pool.total_staked
        .checked_sub(amount)
        .ok_or(StakingError::MathOverflow)?;
    stake_pool.total_weighted_stake = stake_pool.total_weighted_stake
        .checked_sub(weighted_to_remove)
        .ok_or(StakingError::MathOverflow)?;

    // Transfer tokens back to user via PDA signer
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
            from: ctx.accounts.stake_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: stake_pool.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    // Calculate new tier
    let new_tier = calculate_tier(user_stake.staked_amount);

    // Emit event
    emit!(UnstakeEvent {
        user: ctx.accounts.user.key(),
        stake_pool: stake_pool.key(),
        amount,
        weighted_amount_removed: weighted_to_remove,
        remaining_stake: user_stake.staked_amount,
        new_tier,
        timestamp: clock.unix_timestamp,
    });

    msg!("Unstaked {} tokens", amount);
    msg!("Remaining stake: {}", user_stake.staked_amount);
    msg!("New tier: {:?}", new_tier);

    Ok(())
}
