import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { getDefaultWallet } from "../sdk/utils";
import { BN, Program } from "@coral-xyz/anchor";
import { createDepositSolInstruction } from "../sdk/instrument";
(async () => {
  const wallet = getDefaultWallet();
  const connection = new anchor.web3.Connection(
    "https://api.testnet.solana.com",
    "finalized"
  );
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "finalized" }
  );
  const program = new anchor.Program(
    IDL as any,
    Config.MOVE_POOL_ID,
    provider
  ) as Program<MovePool>;

  try {
    const depositSolInstruction = await createDepositSolInstruction(
      program,
      wallet.publicKey,
      new BN(100000000)
    );
    const tx = new anchor.web3.Transaction().add(depositSolInstruction);
    const txHash = await provider.sendAndConfirm(tx, [wallet]);
    console.log("Deposit SOL success at tx", txHash);
  } catch (error) {
    console.error(error);
    throw error;
  }
})();
