import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { getDefaultWallet } from "../sdk/utils";
import { BN, Program } from "@coral-xyz/anchor";
import { createDepositMoveInstruction } from "../sdk/instrument";
import { getAssociatedTokenAddress } from "@solana/spl-token";
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

  const userAta = await getAssociatedTokenAddress(
    Config.MOVE_TOKEN,
    wallet.publicKey
  );
  try {
    const depositSolInstruction = await createDepositMoveInstruction(
      program,
      userAta,
      wallet.publicKey,
      Config.MOVE_TOKEN,
      new BN(10000000000)
    );
    const tx = new anchor.web3.Transaction().add(depositSolInstruction);
    const txHash = await provider.sendAndConfirm(tx, [wallet]);
    console.log("Deposit MOVE success at tx", txHash);
  } catch (error) {
    console.error(error);
    throw error;
  }
})();
