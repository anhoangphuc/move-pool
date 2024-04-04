import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import { delay, getDefaultWallet } from "../sdk/utils";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { assert } from "chai";
import { getAccountData, getPda } from "../sdk/pda";
import {
  createDepositSolInstruction,
  createDepositMoveInstruction,
  createInitializeInstruction,
} from "../sdk/instrument";

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
    try {
      const initializeInstruction = await createInitializeInstruction(
        program,
        moveToken,
        otherWallet.publicKey
      );
      const tx = new anchor.web3.Transaction().add(initializeInstruction);
      await provider.sendAndConfirm(tx, [otherWallet]);
      assert(false);
    } catch (err) {
      assert(err.logs.some((log: string) => log.includes("NotAuthorized")));
    }
  });

  it("Is initialized!", async () => {
    // Add your test here.
    const { vault, programData } = getPda(program);
    const vaultMoveAta = await getAssociatedTokenAddress(
      moveToken,
      vault,
      true
    );
    try {
      const initializeInstruction = await createInitializeInstruction(
        program,
        moveToken,
        provider.publicKey
      );
      const tx = new anchor.web3.Transaction().add(initializeInstruction);
      const txHash = await provider.sendAndConfirm(tx);
      console.log("Initialize success at tx", txHash);
    } catch (err) {
      console.error(err);
      throw err;
    }
    const { globalStateAccount } = await getAccountData(program);
    assert(globalStateAccount.admin.equals(provider.publicKey));
    assert(globalStateAccount.moveToken.equals(moveToken));
    assert((await program.account.vault.fetch(vault)) != null);
    assert((await getAccount(provider.connection, vaultMoveAta)) != null);
  });

  it("Deposit sol successfully", async () => {
    const amount = new BN(5 * LAMPORTS_PER_SOL);
    const { vaultAccount: vaultBefore } = await getAccountData(program);
    try {
      const depositInstruction = await createDepositSolInstruction(
        program,
        otherWallet.publicKey,
        amount
      );
      const tx = new anchor.web3.Transaction().add(depositInstruction);
      const txHash = await provider.sendAndConfirm(tx, [otherWallet]);
      console.log("Deposit sol success at tx", txHash);
    } catch (err) {
      console.error(err);
      throw err;
    }
    const { vaultAccount: vaultAfter } = await getAccountData(program);
    assert(vaultAfter.solAmount.sub(vaultBefore.solAmount).eq(amount));
  });

  it("Deposit sol failure AmountTooSmall", async () => {
    const amount = new BN(0);
    try {
      const depositInstruction = await createDepositSolInstruction(
        program,
        otherWallet.publicKey,
        amount
      );
      const tx = new anchor.web3.Transaction().add(depositInstruction);
      await provider.sendAndConfirm(tx, [otherWallet]);
      assert(false);
    } catch (err) {
      assert(err.logs.some((log: string) => log.includes("ZeroAmountIn")));
    }
  });

  it("Deposit move successfully", async () => {
    const moveMint = await getMint(provider.connection, moveToken);
    const amount = new BN(5 * 10 ** moveMint.decimals);
    const userAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet,
      moveToken,
      otherWallet.publicKey
    );
    await mintTo(
      provider.connection,
      wallet,
      moveToken,
      userAta.address,
      wallet,
      BigInt(amount.toString())
    );
    const { vaultAccount: vaultBefore } = await getAccountData(program);
    const userAtaBefore = await getAccount(
      provider.connection,
      userAta.address
    );
    try {
      const depositMoveInstruction = await createDepositMoveInstruction(
        program,
        userAta.address,
        otherWallet.publicKey,
        moveToken,
        amount
      );
      const tx = new anchor.web3.Transaction().add(depositMoveInstruction);
      const txHash = await provider.sendAndConfirm(tx, [otherWallet]);
      console.log("Deposit move success at tx", txHash);
    } catch (err) {
      console.error(err);
      throw err;
    }
    const { vaultAccount: vaultAfter } = await getAccountData(program);
    const userAtaAfter = await getAccount(provider.connection, userAta.address);
    assert(vaultAfter.moveAmount.sub(vaultBefore.moveAmount).eq(amount));
    assert(
      userAtaBefore.amount - userAtaAfter.amount == BigInt(amount.toString())
    );
  });
});
