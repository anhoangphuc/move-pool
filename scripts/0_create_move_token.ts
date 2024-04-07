import * as anchor from "@coral-xyz/anchor";
import { createMoveToken, getDefaultWallet, wrapTx } from "../sdk/utils";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Config } from "../sdk/config";

(async () => {
  const wallet = getDefaultWallet();
  const connection = new anchor.web3.Connection(
    Config.TESTNET_RPC,
    "finalized"
  );
  const moveToken = await createMoveToken(connection, 7, false);
  console.log("Create move token success: ", moveToken.toBase58());

  const userAta = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    moveToken,
    wallet.publicKey,
    false,
    "finalized"
  );

  const tx = await mintTo(
    connection,
    wallet,
    moveToken,
    userAta.address,
    wallet,
    1000000000000
  );
  console.log("Mint MOVE to user success at tx", wrapTx(tx, connection));
})();
