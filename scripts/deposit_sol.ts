import * as anchor from "@coral-xyz/anchor";
import { MovePool } from "../sdk/contracts/move_pool";
import IDL from "../sdk/contracts/move_pool.json";
import { Config } from "../sdk/config";
import { getBalance, getDefaultWallet } from "../sdk/utils";
import { BN, Program } from "@coral-xyz/anchor";
import { createDepositSolInstruction } from "../sdk/instrument";
import { program } from "commander";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

type MainArgs = { amount?: string; wallet?: string };
const main = async (args: MainArgs) => {
  const amount = args.amount
    ? new BN(Number(args.amount) * LAMPORTS_PER_SOL)
    : // 0.1 SOL
      new BN(100000000);

  const walletPath = args.wallet || "../id2.json";
  const wallet = getDefaultWallet();
  const depositWallet = getDefaultWallet(walletPath);
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

  const { solBalance: solBalanceBefore } = await getBalance(
    connection,
    depositWallet.publicKey,
    Config.MOVE_TOKEN
  );

  try {
    const depositSolInstruction = await createDepositSolInstruction(
      program,
      depositWallet.publicKey,
      amount
    );
    const tx = new anchor.web3.Transaction().add(depositSolInstruction);
    const txHash = await provider.sendAndConfirm(tx, [depositWallet]);
    const { solBalance: solBalanceAfter } = await getBalance(
      connection,
      depositWallet.publicKey,
      Config.MOVE_TOKEN
    );
    console.log(
      `Deposit ${
        (solBalanceBefore - solBalanceAfter) / LAMPORTS_PER_SOL
      } SOL from account ${depositWallet.publicKey.toBase58()} success at tx`,
      txHash
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

program
  .option("-a, --amount <n>", "Amount (uint: SOL) (default: 0.1)")
  .option(
    "-w, --wallet <s>",
    "Wallet path (Relative to the project or absolute path), (default: ../id2.json)"
  )
  .showHelpAfterError();
program.parse();

main(program.opts<MainArgs>());
