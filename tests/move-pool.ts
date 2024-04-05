import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { BN, Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import {
  createMoveToken,
  delay,
  getBalance,
  getDefaultWallet,
} from "../sdk/utils";
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
  createSwapSolToMoveInstruction,
  createSwapMoveToSolInstruction,
  createSetupConfigInstruction,
} from "../sdk/instrument";

describe("move-pool", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MovePool as Program<MovePool>;
  const wallet = getDefaultWallet();

  let moveToken: anchor.web3.PublicKey;
  let otherWallet: anchor.web3.Keypair;
  let moveDecimal: number;
  before(async () => {
    moveDecimal = 7;
    moveToken = await createMoveToken(provider.connection, moveDecimal);

    otherWallet = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(
      otherWallet.publicKey,
      1000 * LAMPORTS_PER_SOL
    );
    await delay(5000);
  });

  describe("INITIALIZE METHOD", () => {
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
        await provider.sendAndConfirm(tx);
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
  });

  describe("DEPOSIT METHOD", () => {
    it("Deposit sol successfully", async () => {
      const amount = new BN(100 * LAMPORTS_PER_SOL);
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
        await provider.sendAndConfirm(tx, [otherWallet]);
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
      const amount = new BN(100 * 10 ** moveDecimal);
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
        await provider.sendAndConfirm(tx, [otherWallet]);
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
        moveUserBalanceBefore - moveUserBalanceAfter ==
          BigInt(amount.toString())
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
        await provider.sendAndConfirm(tx, [otherWallet]);
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

  describe("SWAP METHOD", () => {
    it("Swap SOL to MOVE successfully", async () => {
      const amount = 1;
      const amountIn = new BN(LAMPORTS_PER_SOL).mul(new BN(amount));
      const { vault } = getPda(program);
      const {
        solBalance: solUserBalanceBefore,
        tokenBalance: tokenUserBalanceBefore,
      } = await getBalance(
        provider.connection,
        otherWallet.publicKey,
        moveToken
      );
      const {
        solBalance: solVaultBalanceBefore,
        tokenBalance: tokenVaultBalanceBefore,
      } = await getBalance(provider.connection, vault, moveToken);
      const { vaultAccount: vaultAccountBefore } = await getAccountData(
        program
      );
      try {
        const instruction = await createSwapSolToMoveInstruction(
          program,
          otherWallet.publicKey,
          moveToken,
          amountIn
        );
        const tx = new anchor.web3.Transaction().add(instruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
      } catch (err) {
        console.error(err);
        throw err;
      }
      const {
        solBalance: solUserBalanceAfter,
        tokenBalance: tokenUserBalanceAfter,
      } = await getBalance(
        provider.connection,
        otherWallet.publicKey,
        moveToken
      );
      const {
        solBalance: solVaultBalanceAfter,
        tokenBalance: tokenVaultBalanceAfter,
      } = await getBalance(provider.connection, vault, moveToken);
      const { vaultAccount: vaultAccountAfter } = await getAccountData(program);
      const expectedAmountOut = new BN(10 * amount * 10 ** moveDecimal);
      // SOL user balance decrease by 1
      assert(solUserBalanceBefore - solUserBalanceAfter == amountIn.toNumber());
      // MOVE user balance increase by 10
      assert(
        tokenUserBalanceAfter - tokenUserBalanceBefore ==
          BigInt(expectedAmountOut.toString())
      );
      // SOL vault balance increase by 1
      assert(
        solVaultBalanceAfter - solVaultBalanceBefore == amountIn.toNumber()
      );
      // MOVE vault balance decrease by 10
      assert(
        tokenVaultBalanceBefore - tokenVaultBalanceAfter ==
          BigInt(10 * amount * 10 ** moveDecimal)
      );
      // SOL amount increase by amount
      assert(
        vaultAccountAfter.solAmount
          .sub(vaultAccountBefore.solAmount)
          .eq(amountIn)
      );
      // MOVE amount decrease by amount
      assert(
        vaultAccountBefore.moveAmount
          .sub(vaultAccountAfter.moveAmount)
          .eq(expectedAmountOut)
      );
    });

    it("Swap SOL to MOVE failure ZeroAmountOut", async () => {
      const amountIn = new BN(1);
      try {
        const instruction = await createSwapSolToMoveInstruction(
          program,
          otherWallet.publicKey,
          moveToken,
          amountIn
        );
        const tx = new anchor.web3.Transaction().add(instruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
        assert(false);
      } catch (err) {
        assert(err.logs.some((log: string) => log.includes("ZeroAmountOut")));
      }
    });

    it("Swap MOVE to SOL successfully", async () => {
      const amount = 10;
      const amountIn = new BN(10 ** moveDecimal).mul(new BN(amount));
      const { vault } = getPda(program);
      const {
        solBalance: solUserBalanceBefore,
        tokenBalance: tokenUserBalanceBefore,
      } = await getBalance(
        provider.connection,
        otherWallet.publicKey,
        moveToken
      );
      const {
        solBalance: solVaultBalanceBefore,
        tokenBalance: tokenVaultBalanceBefore,
      } = await getBalance(provider.connection, vault, moveToken);
      const { vaultAccount: vaultAccountBefore } = await getAccountData(
        program
      );
      try {
        const instruction = await createSwapMoveToSolInstruction(
          program,
          otherWallet.publicKey,
          moveToken,
          amountIn
        );
        const tx = new anchor.web3.Transaction().add(instruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
      } catch (err) {
        console.error(err);
        throw err;
      }
      const {
        solBalance: solUserBalanceAfter,
        tokenBalance: tokenUserBalanceAfter,
      } = await getBalance(
        provider.connection,
        otherWallet.publicKey,
        moveToken
      );
      const {
        solBalance: solVaultBalanceAfter,
        tokenBalance: tokenVaultBalanceAfter,
      } = await getBalance(provider.connection, vault, moveToken);
      const { vaultAccount: vaultAccountAfter } = await getAccountData(program);
      const expectedAmountOut = new BN((amount * LAMPORTS_PER_SOL) / 10);
      // SOL user balance increase by expectedAmount
      assert(
        solUserBalanceAfter - solUserBalanceBefore ==
          expectedAmountOut.toNumber()
      );
      // MOVE user balance decrease by amountIn
      assert(
        tokenUserBalanceBefore - tokenUserBalanceAfter ==
          BigInt(amountIn.toString())
      );
      // SOL vault balance decrease by expectedAmount
      assert(
        solVaultBalanceBefore - solVaultBalanceAfter ==
          expectedAmountOut.toNumber()
      );
      // MOVE vault balance increase by mountIn
      assert(
        tokenVaultBalanceAfter - tokenVaultBalanceBefore ==
          BigInt(amountIn.toString())
      );
      // SOL amount decrease by expectedAmount
      assert(
        vaultAccountBefore.solAmount
          .sub(vaultAccountAfter.solAmount)
          .eq(expectedAmountOut)
      );
      // MOVE amount increase by amountIn
      assert(
        vaultAccountAfter.moveAmount
          .sub(vaultAccountBefore.moveAmount)
          .eq(amountIn)
      );
    });
  });

  describe("ADMIN METHOD", () => {
    it("Transfer admin failure unauthorized", async () => {
      try {
        const setupConfigInstruction = await createSetupConfigInstruction(
          program,
          otherWallet.publicKey,
          otherWallet.publicKey,
          null
        );
        const tx = new anchor.web3.Transaction().add(setupConfigInstruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
        assert(false);
      } catch (error) {
        assert(error.logs.some((log: string) => log.includes("NotAuthorized")));
      }
    });

    it("Transfer admin success", async () => {
      try {
        const setupConfigInstruction = await createSetupConfigInstruction(
          program,
          wallet.publicKey,
          otherWallet.publicKey,
          null
        );
        const tx = new anchor.web3.Transaction().add(setupConfigInstruction);
        await provider.sendAndConfirm(tx, [wallet]);
      } catch (error) {
        console.error(error);
        throw error;
      }

      const { globalStateAccount } = await getAccountData(program);
      assert(globalStateAccount.admin.equals(otherWallet.publicKey));
      assert(globalStateAccount.isPending === false);
    });

    it("Set program pending", async () => {
      try {
        const setupConfigInstruction = await createSetupConfigInstruction(
          program,
          otherWallet.publicKey,
          null,
          true
        );
        const tx = new anchor.web3.Transaction().add(setupConfigInstruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
      } catch (error) {
        console.error(error);
        throw error;
      }

      const { globalStateAccount } = await getAccountData(program);
      assert(globalStateAccount.isPending === true);
    });

    it("Can not perform program when pending", async () => {
      try {
        const depositInstruction = await createDepositSolInstruction(
          program,
          otherWallet.publicKey,
          new BN(10000)
        );
        const tx = new anchor.web3.Transaction().add(depositInstruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
        assert(false);
      } catch (err) {
        assert(err.logs.some((log: string) => log.includes("Pending")));
      }

      const userAta = await getAssociatedTokenAddress(
        moveToken,
        otherWallet.publicKey
      );
      try {
        const depositMoveInstruction = await createDepositMoveInstruction(
          program,
          userAta,
          otherWallet.publicKey,
          moveToken,
          new BN(10000)
        );
        const tx = new anchor.web3.Transaction().add(depositMoveInstruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
        assert(false);
      } catch (err) {
        assert(err.logs.some((log: string) => log.includes("Pending")));
      }

      try {
        const instruction = await createSwapSolToMoveInstruction(
          program,
          otherWallet.publicKey,
          moveToken,
          new BN(10000)
        );
        const tx = new anchor.web3.Transaction().add(instruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
        assert(false);
      } catch (err) {
        assert(err.logs.some((log: string) => log.includes("Pending")));
      }

      try {
        const instruction = await createSwapMoveToSolInstruction(
          program,
          otherWallet.publicKey,
          moveToken,
          new BN(10000)
        );
        const tx = new anchor.web3.Transaction().add(instruction);
        await provider.sendAndConfirm(tx, [otherWallet]);
        assert(false);
      } catch (err) {
        assert(err.logs.some((log: string) => log.includes("Pending")));
      }
    });
  });
});
