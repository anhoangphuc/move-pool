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
        deposit_sol::handler(ctx, amount)
    }

    pub fn deposit_move(ctx: Context<DepositMove>, amount: u64) -> Result<()> {
        deposit_move::handler(ctx, amount)
    }

    pub fn swap_sol_to_move(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        swap_sol_to_move::handler(ctx, amount_in)
    }

    pub fn swap_move_to_sol(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
        swap_move_to_sol::handler(ctx, amount_in)
    }
}
