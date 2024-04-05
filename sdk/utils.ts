import * as anchor from "@coral-xyz/anchor";
import path from "path";
import fs from "fs";
import { PublicKey } from "@solana/web3.js";
import {
  createThawAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export function getDefaultWallet() {
  const dataPath = path.join(__dirname, "../id.json");
  console.log("data path ", dataPath);
  const data = fs.readFileSync(dataPath);
  return anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(data.toString()))
  );
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getBalance(
  connection: anchor.web3.Connection,
  address: PublicKey,
  token: PublicKey
) {
  const solBalance = await connection.getBalance(address);
  const ataAddress = await getAssociatedTokenAddress(
    token,
    address,
    !PublicKey.isOnCurve(address)
  );
  const ata = await getAccount(connection, ataAddress);
  return {
    solBalance,
    tokenBalance: ata.amount,
  };
}
