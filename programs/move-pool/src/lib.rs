mod error;
mod events;
mod instructions;
mod states;

use anchor_lang::prelude::*;

use instructions::*;

declare_id!("AmFDUdCyJM8FAo6RrHyfQWb47bR9Ero8Px8u7KeQbhU8");

#[program]
pub mod move_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        deposit::deposit_sol::handler(ctx, amount)
    }

    pub fn deposit_move(ctx: Context<DepositMove>, amount: u64) -> Result<()> {
        deposit::deposit_move::handler(ctx, amount)
    }

    pub fn swap_sol_to_move(ctx: Context<SwapSolToMove>, amount_in: u64) -> Result<()> {
        swap::swap_sol_to_move::handler(ctx, amount_in)
    }
}
