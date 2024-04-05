import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import { delay, getBalance, getDefaultWallet } from "../sdk/utils";
import {
  createMint,
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
    const { vault } = getPda(program);
    const { solBalance: solBalanceBefore } = await getBalance(
      provider.connection,
      vault,
      moveToken
    );
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
    // SOL amount increase by amount
    assert(vaultAfter.solAmount.sub(vaultBefore.solAmount).eq(amount));
    // SOL balance increase by amount
    const { solBalance: solBalanceAfter } = await getBalance(
      provider.connection,
      vault,
      moveToken
    );
    assert(solBalanceAfter - solBalanceBefore == amount.toNumber());
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
      // Fail if no error
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
    const { vault } = getPda(program);
    await mintTo(
      provider.connection,
      wallet,
      moveToken,
      userAta.address,
      wallet,
      BigInt(amount.toString())
    );
    const { vaultAccount: vaultBefore } = await getAccountData(program);
    const { tokenBalance: moveVaultBalanceBefore } = await getBalance(
      provider.connection,
      vault,
      moveToken
    );
    const { tokenBalance: moveUserBalanceBefore } = await getBalance(
      provider.connection,
      otherWallet.publicKey,
      moveToken
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
    const { tokenBalance: moveVaultBalanceAfter } = await getBalance(
      provider.connection,
      vault,
      moveToken
    );
    const { tokenBalance: moveUserBalanceAfter } = await getBalance(
      provider.connection,
      otherWallet.publicKey,
      moveToken
    );
    // Move amount increase by amount
    assert(vaultAfter.moveAmount.sub(vaultBefore.moveAmount).eq(amount));
    // User ATA decrease by amount
    assert(
      moveUserBalanceBefore - moveUserBalanceAfter == BigInt(amount.toString())
    );
    // Vault ATA increase by amount
    assert(
      moveVaultBalanceAfter - moveVaultBalanceBefore ==
        BigInt(amount.toString())
    );
  });

  it("Deposit failure incorrect move_token", async () => {
    const { vault } = getPda(program);
    const fakeToken = await createMint(
      provider.connection,
      otherWallet,
      otherWallet.publicKey,
      null,
      6
    );
    const fakeMint = await getMint(provider.connection, fakeToken);
    const amount = new BN(5 * 10 ** fakeMint.decimals);
    const userAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      otherWallet,
      fakeToken,
      otherWallet.publicKey
    );
    await mintTo(
      provider.connection,
      wallet,
      fakeToken,
      userAta.address,
      otherWallet,
      BigInt(amount.toString())
    );
    await getOrCreateAssociatedTokenAccount(
      provider.connection,
      otherWallet,
      fakeToken,
      vault,
      true
    );
    try {
      const depositMoveInstruction = await createDepositMoveInstruction(
        program,
        userAta.address,
        otherWallet.publicKey,
        fakeToken,
        amount
      );
      const tx = new anchor.web3.Transaction().add(depositMoveInstruction);
      const txHash = await provider.sendAndConfirm(tx, [otherWallet]);
      assert(false);
    } catch (err) {
      assert(
        err.logs.some(
          (log: string) =>
            log.includes("move_token") && log.includes("ConstraintAddress")
        )
      );
    }
  });
});
