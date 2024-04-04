import * as anchor from "@coral-xyz/anchor";
import * as token from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import { getDefaultWallet } from "./utils";
import {
  getAccount,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Config } from "./config";
import { assert } from "chai";

describe("move-pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MovePool as Program<MovePool>;
  const wallet = getDefaultWallet();

  let moveToken: anchor.web3.PublicKey;
  before(async () => {
    moveToken = await token.createMint(
      provider.connection,
      wallet,
      provider.publicKey,
      null,
      8
    );
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const { globalState, vault, programData } = getPda();
    const vaultMoveAta = await getAssociatedTokenAddress(
      moveToken,
      vault,
      true
    );
    const tx = await program.methods
      .initialize()
      .accounts({
        moveToken,
        globalState,
        vault,
        authority: provider.publicKey,
        program: program.programId,
        programData: programData,
        vaultMoveAta,
      })
      .rpc();
    console.log("Initialize success at tx", tx);

    const globalStateAccount = await program.account.globalState.fetch(
      globalState
    );
    assert(globalStateAccount.admin.equals(provider.publicKey));
    assert(globalStateAccount.moveToken.equals(moveToken));
    assert((await program.account.vault.fetch(vault)) != null);
    assert((await getAccount(provider.connection, vaultMoveAta)) != null);
  });

  function getPda() {
    const [globalState] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );
    const [vault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );
    const [programData] = anchor.web3.PublicKey.findProgramAddressSync(
      [program.programId.toBuffer()],
      Config.BPF_LOADER_PROGRAM_ID
    );
    return { globalState, vault, programData };
  }
});
