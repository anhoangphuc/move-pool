import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { delay, getBalance, getDefaultWallet } from "../sdk/utils";
import { BN, Program } from "@coral-xyz/anchor";
import { createSwapSolToMoveInstruction } from "../sdk/instrument";
import { program } from "commander";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

type MainArgs = { amount?: string; wallet?: string };
const main = async (args: MainArgs) => {
  const amount = args.amount
    ? new BN(Number(args.amount) * LAMPORTS_PER_SOL)
    : new BN(100000000);

  const walletPath = args.wallet || "../id2.json";
  const wallet = getDefaultWallet();
  const swapWallet = getDefaultWallet(walletPath);
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

  const moveMint = await getMint(connection, Config.MOVE_TOKEN, "finalized");
  await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    Config.MOVE_TOKEN,
    swapWallet.publicKey
  );
  await delay(3000);

  const { tokenBalance: moveBalanceBefore, solBalance: solBalanceBefore } =
    await getBalance(connection, swapWallet.publicKey, Config.MOVE_TOKEN);

  try {
    const swapSolToMoveInstruction = await createSwapSolToMoveInstruction(
      program,
      swapWallet.publicKey,
      Config.MOVE_TOKEN,
      amount
    );
    const tx = new anchor.web3.Transaction().add(swapSolToMoveInstruction);
    const txHash = await provider.sendAndConfirm(tx, [swapWallet]);
    await delay(2000);
    const { tokenBalance: moveBalanceAfter, solBalance: solBalanceAfter } =
      await getBalance(connection, swapWallet.publicKey, Config.MOVE_TOKEN);
    console.log(
      `Account ${swapWallet.publicKey.toBase58()} swap ${
        (Number(solBalanceBefore) - Number(solBalanceAfter)) / LAMPORTS_PER_SOL
      } SOL for ${
        (Number(moveBalanceAfter) - Number(moveBalanceBefore)) /
        10 ** moveMint.decimals
      } MOVE success at tx`,
      txHash
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

program
  .option("-a, --amount <n>", "Amount (uint: MOVE) (default: 1)")
  .option(
    "-w, --wallet <s>",
    "Wallet path (Relative to the project or absolute path), (default: ../id2.json)"
  )
  .showHelpAfterError();
program.parse();

main(program.opts<MainArgs>());
