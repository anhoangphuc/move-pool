import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import { delay, getDefaultWallet } from "./utils";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Config } from "./config";
import { assert } from "chai";

describe("move-pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MovePool as Program<MovePool>;
  const wallet = getDefaultWallet();

  let moveToken: anchor.web3.PublicKey;
  let otherWallet: anchor.web3.Keypair;
  before(async () => {
    moveToken = await token.createMint(
      provider.connection,
      wallet,
      provider.publicKey,
      null,
      8
    );

    otherWallet = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(
      otherWallet.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await delay(5000);
  });

  it("Initialize failure unauthorized", async () => {
    const { globalState, vault, programData } = getPda();
    const vaultMoveAta = await getAssociatedTokenAddress(
      moveToken,
      vault,
      true
    );
    try {
      await program.methods
        .initialize()
        .accounts({
          moveToken,
          globalState,
          vault,
          authority: otherWallet.publicKey,
          program: program.programId,
          programData: programData,
          vaultMoveAta,
        })
        .signers([otherWallet])
        .rpc();
      assert(false);
    } catch (err) {
      assert(err.error.errorCode.code === "NotAuthorized");
    }
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

  it("Deposit sol successfully", async () => {
    const amount = new BN(5 * LAMPORTS_PER_SOL);
    const { globalState, vault } = getPda();
    const { vaultAccount: vaultBefore } = await getAccountData();
    try {
      const tx = await program.methods
        .depositSol(amount)
        .accounts({
          globalState,
          vault,
          user: otherWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherWallet])
        .rpc();
      console.log("Deposit sol success at tx", tx);
    } catch (err) {
      console.error(err);
      throw err;
    }

    const { vaultAccount: vaultAfter } = await getAccountData();
    assert(vaultAfter.solAmount.sub(vaultBefore.solAmount).eq(amount));
  });

  it("Deposit sol failure AmountTooSmall", async () => {
    const amount = new BN(0);
    const { globalState, vault } = getPda();
    try {
      const tx = await program.methods
        .depositSol(amount)
        .accounts({
          globalState,
          vault,
          user: otherWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherWallet])
        .rpc();
      console.log("Deposit sol success at tx", tx);
    } catch (err) {
      assert(err.error.errorCode.code === "AmountTooSmall");
    }
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

  async function getAccountData() {
    const { globalState, vault } = getPda();
    const globalStateAccount = await program.account.globalState.fetch(
      globalState
    );
    const vaultAccount = await program.account.vault.fetch(vault);
    return { globalStateAccount, vaultAccount };
  }
});
