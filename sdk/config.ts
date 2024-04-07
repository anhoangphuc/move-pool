import * as anchor from "@coral-xyz/anchor";
export class Config {
  static BPF_LOADER_PROGRAM_ID = new anchor.web3.PublicKey(
    "BPFLoaderUpgradeab1e11111111111111111111111"
  );

  static MOVE_POOL_ID = new anchor.web3.PublicKey(
    "AmFDUdCyJM8FAo6RrHyfQWb47bR9Ero8Px8u7KeQbhU8"
  );
  static MOVE_TOKEN = new anchor.web3.PublicKey(
    "618n2rrKFSGr45Lf3mnfxvdTt4zZERXM7FfSATVSjecu"
  );

  static TESTNET_RPC = "https://api.testnet.solana.com";

  static DEVNET_RPC = "https://api.devnet.solana.com";

  static MOVE_TOKEN_DEVNET = "HJB9uE7wPSRv6WSib8kR7ZcZSGfcxbBtT1ZTLuf36F6a";
}
