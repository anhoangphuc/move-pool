use anchor_lang::prelude::*;

#[account]
pub struct Vault {}

impl Vault {
    pub const SPACE: usize = 0;
    pub const SEED: &'static [u8] = b"vault";
}
