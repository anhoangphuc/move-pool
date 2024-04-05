use anchor_lang::prelude::*;

#[event]
pub struct SwapSolToMove {
    pub user: Pubkey,
    pub sol_in: u64,
    pub user_move_ata: Pubkey,
    pub move_out: u64,
}

#[event]
pub struct SwapMoveToSol {
    pub user_move_ata: Pubkey,
    pub move_in: u64,
    pub user: Pubkey,
    pub sol_out: u64,
}
