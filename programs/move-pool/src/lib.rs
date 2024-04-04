use anchor_lang::prelude::*;

declare_id!("AmFDUdCyJM8FAo6RrHyfQWb47bR9Ero8Px8u7KeQbhU8");

#[program]
pub mod move_pool {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
