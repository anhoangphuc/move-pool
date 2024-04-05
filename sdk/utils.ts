import * as anchor from "@coral-xyz/anchor";
import path from "path";
import fs from "fs";
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

import { Metaplex } from "@metaplex-foundation/js";

import {
  DataV2,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";

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

export async function createMoveToken(
  connection: anchor.web3.Connection,
  moveDecimal: number
) {
  const keypair = getDefaultWallet();
  const metaplex = Metaplex.make(connection);
  const mint = await token.createMint(
    connection,
    keypair,
    keypair.publicKey,
    keypair.publicKey,
    moveDecimal
  );

  // get metadata account address
  const metadataPDA = metaplex.nfts().pdas().metadata({ mint });

  // onchain metadata format
  const tokenMetadata = {
    name: "MOVE",
    symbol: "MOVE",
    uri: "https://gist.github.com/anhoangphuc/26767ad8edb62f1b934820867eecd1f8",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2;

  // transaction to create metadata account
  const transaction = new web3.Transaction().add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: new PublicKey(metadataPDA.toString()),
        mint: mint,
        mintAuthority: keypair.publicKey,
        payer: keypair.publicKey,
        updateAuthority: keypair.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenMetadata,
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );

  const transactionSignature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair]
  );

  console.log(
    `Create token MOVE with address ${mint.toBase58()} at transaction ${transactionSignature}`
  );
  return mint;
}
