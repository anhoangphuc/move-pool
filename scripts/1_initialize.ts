import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { getDefaultWallet } from "../sdk/utils";
import { Program } from "@coral-xyz/anchor";
import { createInitializeInstruction } from "../sdk/instrument";
(async () => {
  const wallet = getDefaultWallet();
  const connection = new anchor.web3.Connection(
    Config.TESTNET_RPC,
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
    const initializeInstruction = await createInitializeInstruction(
      program,
      Config.MOVE_TOKEN,
      wallet.publicKey
    );
    const tx = new anchor.web3.Transaction().add(initializeInstruction);
    const txHash = await provider.sendAndConfirm(tx, [wallet]);
    console.log("Initialize success at tx", txHash);
  } catch (error) {
    console.error(error);
    throw error;
  }
})();
