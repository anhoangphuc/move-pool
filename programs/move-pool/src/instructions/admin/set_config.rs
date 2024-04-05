use crate::error::MovePoolError;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetConfig<'info> {
    #[account(
        mut,
        seeds = [GlobalState::SEED],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        constraint = admin.key() == global_state.admin @ MovePoolError::NotAuthorized,
    )]
    pub admin: Signer<'info>,
}

pub fn handler(
    ctx: Context<SetConfig>,
    admin: Option<Pubkey>,
    is_pending: Option<bool>,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.set_admin(admin)?;
    global_state.set_pending(is_pending)?;
    Ok(())
}
