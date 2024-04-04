import * as anchor from "@coral-xyz/anchor";
import path from "path";
import fs from "fs";

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
