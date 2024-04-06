import * as anchor from "@coral-xyz/anchor";
import { getDefaultWallet } from "../sdk/utils";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Config } from "../sdk/config";
import { program } from "commander";

type MainArgs = { wallet?: string };
const main = async (args: MainArgs) => {
  const walletPath = args.wallet || "../id2.json";
  const wallet = getDefaultWallet();
  const faucetWallet = getDefaultWallet(walletPath);
  const connection = new anchor.web3.Connection(
    Config.TESTNET_RPC,
    "finalized"
  );
  const moveMint = await getMint(connection, Config.MOVE_TOKEN, "finalized");

  const userAta = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    Config.MOVE_TOKEN,
    faucetWallet.publicKey,
    false,
    "finalized"
  );

  const tx = await mintTo(
    connection,
    wallet,
    Config.MOVE_TOKEN,
    userAta.address,
    wallet,
    BigInt(1000 * 10 ** moveMint.decimals)
  );
  console.log(
    `Mint 1000 MOVE to user ${faucetWallet.publicKey} success at tx`,
    tx
  );
};

program
  .option(
    "-w, --wallet <s>",
    "Wallet path (Relative to the project or absolute path), (default: ../id2.json)"
  )
  .showHelpAfterError();
program.parse();

main(program.opts<MainArgs>());
