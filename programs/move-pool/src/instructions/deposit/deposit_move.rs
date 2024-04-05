use crate::error::MovePoolError::{self, ZeroAmountIn};
use crate::events;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct DepositMove<'info> {
    #[account(
        constraint = global_state.is_pending == false @ MovePoolError::Pending,
        seeds = [GlobalState::SEED],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        address = global_state.move_token,
    )]
    pub move_token: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [Vault::SEED],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        constraint = user_ata.mint == move_token.key(),
    )]
    pub user_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = move_token,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,
    #[account()]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<DepositMove>, amount: u64) -> Result<()> {
    if amount == 0 {
        return Err(ZeroAmountIn.into());
    }
    let vault = &mut ctx.accounts.vault;
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_ata.to_account_info(),
                to: ctx.accounts.vault_ata.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;
    vault.deposit(None, Some(amount))?;

    emit!(events::deposit::DepositMove {
        user_ata: *ctx.accounts.user_ata.to_account_info().key,
        amount,
    });

    Ok(())
}
