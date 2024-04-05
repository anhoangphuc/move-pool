use anchor_lang::prelude::*;

#[error_code]
pub enum MovePoolError {
    #[msg("Not Authorized")]
    NotAuthorized,
    #[msg("ZeroAmountIn")]
    ZeroAmountIn,
    #[msg("ZeroAmountOut")]
    ZeroAmountOut,
    #[msg("NotEnoughBalance")]
    NotEnoughBalance,
    #[msg("MathError")]
    MathError,
    #[msg("Pending")]
    Pending,
}
