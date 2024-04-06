import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { delay, getBalance, getDefaultWallet } from "../sdk/utils";
import { BN, Program } from "@coral-xyz/anchor";
import { createSwapSolToMoveInstruction } from "../sdk/instrument";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
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

  const amount = 10000000;
  const moveMint = await getMint(connection, Config.MOVE_TOKEN, "finalized");

  try {
    const { tokenBalance: moveBalanceBefore } = await getBalance(
      connection,
      wallet.publicKey,
      Config.MOVE_TOKEN
    );
    const swapSolToMoveInstruction = await createSwapSolToMoveInstruction(
      program,
      wallet.publicKey,
      Config.MOVE_TOKEN,
      new BN(amount)
    );
    const tx = new anchor.web3.Transaction().add(swapSolToMoveInstruction);
    const txHash = await provider.sendAndConfirm(tx, [wallet]);
    await delay(3000);
    const { tokenBalance: moveBalanceAfter } = await getBalance(
      connection,
      wallet.publicKey,
      Config.MOVE_TOKEN
    );
    const moveBalanceChanged = moveBalanceAfter - moveBalanceBefore;

    console.log(
      `Swap ${amount / LAMPORTS_PER_SOL} SOL for ${
        Number(moveBalanceChanged) / 10 ** moveMint.decimals
      } MOVE`,
      txHash
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
})();
