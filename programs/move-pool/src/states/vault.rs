use crate::error::MovePoolError;
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
            if self.sol_amount.checked_add(sol_amount).is_none() {
                return Err(MovePoolError::MathError.into());
            }
            self.sol_amount += sol_amount;
        }
        if let Some(move_amount) = move_amount {
            if self.sol_amount.checked_add(move_amount).is_none() {
                return Err(MovePoolError::MathError.into());
            }
            self.move_amount += move_amount;
        }
        Ok(())
    }

    pub fn withdraw(&mut self, sol_amount: Option<u64>, move_amount: Option<u64>) -> Result<()> {
        if let Some(sol_amount) = sol_amount {
            if self.sol_amount < sol_amount {
                return Err(MovePoolError::MathError.into());
            }
            self.sol_amount -= sol_amount;
        }
        if let Some(move_amount) = move_amount {
            if self.move_amount < move_amount {
                return Err(MovePoolError::MathError.into());
            }
            self.move_amount -= move_amount;
        }
        Ok(())
    }
}

#[test]
fn test_deposit_success() {
    let mut vault = Vault {
        sol_amount: 0,
        move_amount: 0,
    };
    vault.deposit(Some(10), None).unwrap();
    assert_eq!(vault.sol_amount, 10);
    assert_eq!(vault.move_amount, 0);

    vault.deposit(None, Some(20)).unwrap();
    assert_eq!(vault.sol_amount, 10);
    assert_eq!(vault.move_amount, 20);
}

#[test]
fn test_deposit_failure_overflow() {
    let mut vault = Vault {
        sol_amount: 10,
        move_amount: 10,
    };
    assert_eq!(
        vault.deposit(Some(u64::MAX), None).unwrap_err(),
        MovePoolError::MathError.into()
    );
    assert_eq!(
        vault.deposit(None, Some(u64::MAX)).unwrap_err(),
        MovePoolError::MathError.into()
    );
}

#[test]
fn test_withdraw_success() {
    let mut vault = Vault {
        sol_amount: 10,
        move_amount: 10,
    };
    vault.withdraw(Some(5), None).unwrap();
    assert_eq!(vault.sol_amount, 5);
    assert_eq!(vault.move_amount, 10);

    vault.withdraw(None, Some(5)).unwrap();
    assert_eq!(vault.sol_amount, 5);
    assert_eq!(vault.move_amount, 5);
}

#[test]
fn test_withdraw_failure_underflow() {
    let mut vault = Vault {
        sol_amount: 10,
        move_amount: 10,
    };
    assert_eq!(
        vault.withdraw(Some(11), None).unwrap_err(),
        MovePoolError::MathError.into()
    );
    assert_eq!(
        vault.withdraw(None, Some(11)).unwrap_err(),
        MovePoolError::MathError.into()
    );
}
