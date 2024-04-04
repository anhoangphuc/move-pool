use anchor_lang::prelude::*;

#[error_code]
pub enum MovePoolError {
    #[msg("Not Authorized")]
    NotAuthorized,
    #[msg("ZeroAmountIn")]
    ZeroAmountIn,
}
