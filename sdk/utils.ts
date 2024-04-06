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

export function getDefaultWallet(walletPath?: string) {
  walletPath = walletPath ? walletPath : "../id.json";
  // If start with . then it is a relative path
  // Else it is an absolute path
  const dataPath = walletPath.startsWith(".")
    ? path.join(__dirname, walletPath)
    : path.join(walletPath);
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
  moveDecimal: number,
  withMetadata?: boolean
) {
  const keypair = getDefaultWallet();
  const metaplex = Metaplex.make(connection);
  const balance = await connection.getBalance(keypair.publicKey);
  console.log("Balance is ", balance);
  const mint = await token.createMint(
    connection,
    keypair,
    keypair.publicKey,
    keypair.publicKey,
    moveDecimal
  );
  console.log("Create mint success ", mint.toBase58());

  // Could not add token metadata to the token in the testnet, due this issues:
  // https://github.com/metaplex-foundation/mpl-token-metadata/issues/91
  // So we could return early if we are in the testnet

  if (!withMetadata) {
    return mint;
  }

  const metadataPDA = metaplex.nfts().pdas().metadata({ mint });
  // onchain metadata format
  const tokenMetadata = {
    name: "MOVE",
    symbol: "MOVE",
    uri: "https://gist.githubusercontent.com/anhoangphuc/26767ad8edb62f1b934820867eecd1f8/raw/4d0afc52d2d0fce1ab83088483d227199550ca20/move_metadata.txt",
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

  try {
    const transactionSignature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair]
    );
    console.log(
      `Create token MOVE with address ${mint.toBase58()} at transaction ${transactionSignature}`
    );
  } catch (error) {
    console.error(error);
    throw error;
  }

  return mint;
}
