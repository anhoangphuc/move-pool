import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { delay, getBalance, getDefaultWallet } from "../sdk/utils";
import { BN, Program } from "@coral-xyz/anchor";
import { createSwapMoveToSolInstruction } from "../sdk/instrument";
import { program } from "commander";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

type MainArgs = { amount?: string; wallet?: string };
const main = async (args: MainArgs) => {
  const connection = new anchor.web3.Connection(
    Config.TESTNET_RPC,
    "finalized"
  );
  const moveMint = await getMint(connection, Config.MOVE_TOKEN, "finalized");
  const amount = args.amount
    ? new BN(Number(args.amount) * 10 ** moveMint.decimals)
    : new BN(1 * 10 ** moveMint.decimals);

  const walletPath = args.wallet || "../id2.json";
  const wallet = getDefaultWallet();
  const swapWallet = getDefaultWallet(walletPath);
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

  await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    Config.MOVE_TOKEN,
    swapWallet.publicKey
  );
  await delay(3000);

  const { solBalance: solBalanceBefore, tokenBalance: moveBalanceBefore } =
    await getBalance(connection, swapWallet.publicKey, Config.MOVE_TOKEN);

  try {
    const swapMoveToSolInstruction = await createSwapMoveToSolInstruction(
      program,
      swapWallet.publicKey,
      Config.MOVE_TOKEN,
      amount
    );
    const tx = new anchor.web3.Transaction().add(swapMoveToSolInstruction);
    const txHash = await provider.sendAndConfirm(tx, [swapWallet]);
    await delay(2000);
    const { solBalance: solBalanceAfter, tokenBalance: moveBalanceAfter } =
      await getBalance(connection, swapWallet.publicKey, Config.MOVE_TOKEN);
    console.log(
      `Account ${swapWallet.publicKey.toBase58()} swap ${
        Number(moveBalanceBefore - moveBalanceAfter) / 10 ** moveMint.decimals
      } MOVE for ${
        (Number(solBalanceAfter) - Number(solBalanceBefore)) / LAMPORTS_PER_SOL
      } SOL success at tx`,
      txHash
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

program
  .option("-a, --amount <n>", "Amount (unit: MOVE) (default: 1)")
  .option(
    "-w, --wallet <s>",
    "Wallet path (Relative to the project or absolute path), (default: ../id2.json)"
  )
  .showHelpAfterError();
program.parse();

main(program.opts<MainArgs>());
