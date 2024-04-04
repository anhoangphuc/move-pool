use crate::error::MovePoolError;
use crate::events;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(
        constraint = global_state.is_pending == false,
        seeds = [GlobalState::SEED],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [Vault::SEED],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
    let system_program = &ctx.accounts.system_program;
    let vault = &mut ctx.accounts.vault;
    if amount == 0 {
        return Err(MovePoolError::AmountTooSmall.into());
    }
    system_program::transfer(
        CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: vault.to_account_info(),
            },
        ),
        amount,
    )?;
    vault.deposit(Some(amount), None)?;

    emit!(events::deposit::DepositSol {
        user: *ctx.accounts.user.key,
        amount,
    });

    Ok(())
}
