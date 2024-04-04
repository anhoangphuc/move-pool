use anchor_lang::prelude::*;

#[event]
pub struct DepositSol {
    pub amount: u64,
    pub user: Pubkey,
}

#[event]
pub struct DepositMove {
    pub amount: u64,
    pub user_ata: Pubkey,
}
