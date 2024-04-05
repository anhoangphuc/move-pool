use crate::error::MovePoolError;
use crate::events;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        seeds = [GlobalState::SEED],
        bump,
        constraint = global_state.is_pending == false @ MovePoolError::Pending,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        address = global_state.move_token,
    )]
    pub move_token: Account<'info, Mint>,

    // User account
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        constraint = user_ata.mint == move_token.key(),
    )]
    pub user_ata: Account<'info, TokenAccount>,

    // Vault account
    #[account(
        mut,
        seeds = [Vault::SEED],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        mut,
        associated_token::mint = move_token,
        associated_token::authority = vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
    if amount_in == 0 {
        return Err(MovePoolError::ZeroAmountIn.into());
    }

    let vault = &mut ctx.accounts.vault;
    let user = &ctx.accounts.user;
    let user_ata = &ctx.accounts.user_ata;
    let vault_ata = &ctx.accounts.vault_ata;
    let system_program = &ctx.accounts.system_program;

    // Transfer SOL from user to vault
    system_program::transfer(
        CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: user.to_account_info(),
                to: vault.to_account_info(),
            },
        ),
        amount_in,
    )?;

    let amount_out = get_move_out(amount_in, ctx.accounts.move_token.decimals)?;
    if amount_out == 0 {
        return Err(MovePoolError::ZeroAmountOut.into());
    }
    if amount_out > vault.move_amount {
        return Err(MovePoolError::NotEnoughBalance.into());
    }

    // Transfer MOVE from vault_ata to user_ata
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: vault_ata.to_account_info(),
                to: user_ata.to_account_info(),
                authority: vault.to_account_info(),
            },
            &[&[Vault::SEED, &[ctx.bumps.vault]]],
        ),
        amount_out,
    )?;

    // Update vault balances
    vault.deposit(Some(amount_in), None)?;
    vault.withdraw(None, Some(amount_out))?;

    emit!(events::swap::SwapSolToMove {
        user: *user.key,
        sol_in: amount_in,
        user_move_ata: user_ata.key(),
        move_out: amount_out,
    });

    Ok(())
}

fn get_move_out(amount_in: u64, move_decimal: u8) -> Result<u64> {
    // Decimal of SOL is 9
    let amount_out = (amount_in as u128) * 10 * 10_u128.pow(move_decimal as u32) / 10_u128.pow(9);
    if amount_out > u64::MAX as u128 {
        Err(MovePoolError::MathError.into())
    } else {
        Ok(amount_out as u64)
    }
}

#[test]
fn test_get_move_out_with_decimal_9() {
    assert_eq!(get_move_out(1_000_000_000, 9), Ok(10_000_000_000));
    assert_eq!(get_move_out(100_000_000, 9), Ok(1_000_000_000));
    assert_eq!(get_move_out(1, 9), Ok(10));
}

#[test]
fn test_get_move_out_with_decimal_6() {
    assert_eq!(get_move_out(1_000_000_000, 6), Ok(10_000_000));
    assert_eq!(get_move_out(100_000_000, 6), Ok(1_000_000));
    assert_eq!(get_move_out(1, 6), Ok(0));
}

#[test]
fn test_get_move_out_with_decimal_12() {
    assert_eq!(get_move_out(1_000_000_000, 12), Ok(10_000_000_000_000));
    assert_eq!(get_move_out(100_000_000, 12), Ok(1_000_000_000_000));
    assert_eq!(get_move_out(1, 12), Ok(10_000));
    assert_eq!(
        get_move_out(u64::MAX, 12),
        Err(MovePoolError::MathError.into())
    );
}
