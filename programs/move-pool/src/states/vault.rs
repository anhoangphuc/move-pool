use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    /// The deposited SOL amount
    pub sol_amount: u64, // 8 bytes
    /// The deposited MOVE amount
    pub move_amount: u64, // 8 bytes
}

impl Vault {
    pub const SPACE: usize = 8 * 2;
    pub const SEED: &'static [u8] = b"vault";

    pub fn deposit(&mut self, sol_amount: Option<u64>, move_amount: Option<u64>) -> Result<()> {
        if let Some(sol_amount) = sol_amount {
            self.sol_amount += sol_amount;
        }
        if let Some(move_amount) = move_amount {
            self.move_amount += move_amount;
        }
        Ok(())
    }

    pub fn withdraw(&mut self, sol_amount: Option<u64>, move_amount: Option<u64>) -> Result<()> {
        if let Some(sol_amount) = sol_amount {
            self.sol_amount -= sol_amount;
        }
        if let Some(move_amount) = move_amount {
            self.move_amount -= move_amount;
        }
        Ok(())
    }
}
