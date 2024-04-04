use crate::error::MovePoolError;
use crate::program::MovePool;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Initialize<'info> {
    // Global_state for saving information about the program
    #[account(
        init,
        payer = authority,
        space = 8 + GlobalState::SPACE,
        seeds = [GlobalState::SEED],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    // Vault for sending and receiving assets
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::SPACE,
        seeds = [Vault::SEED],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account()]
    pub move_token: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = move_token,
        associated_token::authority = vault,
    )]
    pub vault_move_ata: Account<'info, TokenAccount>,
    #[account(
        constraint = program.programdata_address()? == Some(program_data.key()),
    )]
    pub program: Program<'info, MovePool>,
    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key()) @ MovePoolError::NotAuthorized,
    )]
    pub program_data: Account<'info, ProgramData>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// Initialize the program
// Only the program owner can call this instruction
pub fn handler<'info>(ctx: Context<Initialize>) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.initialize(ctx.accounts.authority.key(), ctx.accounts.move_token.key())
}
