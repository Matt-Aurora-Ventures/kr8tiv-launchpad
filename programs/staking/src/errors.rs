use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Invalid stake amount - must be greater than zero")]
    InvalidAmount,

    #[msg("Lock duration is too short - minimum 7 days required")]
    DurationTooShort,

    #[msg("Lock duration is too long - maximum 365 days allowed")]
    DurationTooLong,

    #[msg("Insufficient staked balance for this operation")]
    InsufficientStake,

    #[msg("Tokens are still locked - cannot unstake before lock period ends")]
    StillLocked,

    #[msg("No pending rewards to claim")]
    NoPendingRewards,

    #[msg("Arithmetic overflow occurred")]
    MathOverflow,

    #[msg("Invalid authority for this operation")]
    InvalidAuthority,

    #[msg("Stake pool is paused")]
    PoolPaused,

    #[msg("Invalid mint address")]
    InvalidMint,
}
