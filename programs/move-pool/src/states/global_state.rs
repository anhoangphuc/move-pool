use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    /// Address of the admin address, used for set pending status
    pub admin: Pubkey, // 32 bytes
    /// Address of the move_token
    pub move_token: Pubkey, // 32 bytes
    /// Pending status of the pool, paused in case of emergency
    pub is_pending: bool, // 1 byte
}

impl GlobalState {
    pub const SPACE: usize = 32 * 2 + 1;
    pub const SEED: &'static [u8] = b"global_state";

    pub fn initialize(&mut self, admin: Pubkey, move_token: Pubkey) -> Result<()> {
        self.admin = admin;
        self.move_token = move_token;

        Ok(())
    }
}
