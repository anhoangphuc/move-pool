use crate::error::MovePoolError;
use crate::events;
use crate::instructions::Swap;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token;

pub fn handler(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
    if amount_in == 0 {
        return Err(MovePoolError::ZeroAmountIn.into());
    }

    let vault = &mut ctx.accounts.vault;
    let user = &ctx.accounts.user;
    let user_ata = &ctx.accounts.user_ata;
    let vault_ata = &ctx.accounts.vault_ata;
    let system_program = &ctx.accounts.system_program;

    msg!("Start transfer MOVE");
    // Transfer MOVE from user_ata to vault_ata
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: user_ata.to_account_info(),
                to: vault_ata.to_account_info(),
                authority: user.to_account_info(),
            },
        ),
        amount_in,
    )?;

    let amount_out = get_sol_out(amount_in, ctx.accounts.move_token.decimals)?;
    if amount_out == 0 {
        return Err(MovePoolError::ZeroAmountOut.into());
    }
    if amount_out > vault.sol_amount {
        return Err(MovePoolError::NotEnoughBalance.into());
    };

    msg!("Start transfer SOL");
    // Transfer SOL from vault to user
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program.to_account_info(),
            system_program::Transfer {
                from: vault.to_account_info(),
                to: user.to_account_info(),
            },
            &[&[Vault::SEED, &[ctx.bumps.vault]]],
        ),
        amount_out,
    )?;
    // Update vault balances
    vault.deposit(None, Some(amount_in))?;
    vault.withdraw(Some(amount_out), None)?;

    emit!(events::swap::SwapMoveToSol {
        user_move_ata: user_ata.key(),
        move_in: amount_in,
        user: *user.key,
        sol_out: amount_out,
    });

    Ok(())
}

fn get_sol_out(amount_in: u64, move_decimal: u8) -> Result<u64> {
    let amount_out = (amount_in as u128) * 10u128.pow(9) / 10 / 10u128.pow(move_decimal as u32);
    if amount_out > u64::MAX as u128 {
        return Err(MovePoolError::MathError.into());
    } else {
        Ok(amount_out as u64)
    }
}

#[test]
fn test_get_sol_out_with_decimal_9() {
    assert_eq!(get_sol_out(1_000_000_000, 9), Ok(100_000_000));
    assert_eq!(get_sol_out(100_000_000, 9), Ok(10_000_000));
    assert_eq!(get_sol_out(10, 9), Ok(1));
    assert_eq!(get_sol_out(1, 9), Ok(0));
}

#[test]
fn test_get_move_out_with_decimal_6() {
    assert_eq!(get_sol_out(1_000_000, 6), Ok(100_000_000));
    assert_eq!(get_sol_out(100_000, 6), Ok(10_000_000));
    assert_eq!(get_sol_out(1, 6), Ok(100));
    assert_eq!(
        get_sol_out(u64::MAX, 6),
        Err(MovePoolError::MathError.into())
    );
}

#[test]
fn test_get_move_out_with_decimal_12() {
    assert_eq!(get_sol_out(1_000_000_000_000, 12), Ok(100_000_000));
    assert_eq!(get_sol_out(100_000_000_000, 12), Ok(10_000_000));
    assert_eq!(get_sol_out(1000, 12), Ok(0));
}
