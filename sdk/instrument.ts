import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import { getPda } from "./pda";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export async function createInitializeInstruction(
  program: Program<MovePool>,
  moveToken: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey
) {
  const { globalState, vault, programData } = getPda(program);
  const vaultMoveAta = await getAssociatedTokenAddress(moveToken, vault, true);
  return await program.methods
    .initialize()
    .accounts({
      moveToken,
      globalState,
      vault,
      authority,
      program: program.programId,
      programData: programData,
      vaultMoveAta,
    })
    .instruction();
}
export async function createDepositSolInstruction(
  program: Program<MovePool>,
  user: anchor.web3.PublicKey,
  amount: BN
) {
  const { globalState, vault } = getPda(program);
  return await program.methods
    .depositSol(amount)
    .accounts({
      globalState,
      vault,
      user: user,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .instruction();
}

export async function createDepositMoveInstruction(
  program: Program<MovePool>,
  userAta: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey,
  moveToken: anchor.web3.PublicKey,
  amount: BN
) {
  const { globalState, vault } = getPda(program);
  const vaultAta = await getAssociatedTokenAddress(moveToken, vault, true);
  return await program.methods
    .depositMove(amount)
    .accounts({
      globalState,
      vault,
      userAta,
      vaultAta,
      authority,
      moveToken,
    })
    .instruction();
}

export async function createSwapSolToMoveInstruction(
  program: Program<MovePool>,
  user: anchor.web3.PublicKey,
  moveToken: PublicKey,
  amountIn: BN
) {
  const { globalState, vault } = getPda(program);
  const userAta = await getAssociatedTokenAddress(moveToken, user);
  const vaultAta = await getAssociatedTokenAddress(moveToken, vault, true);
  return await program.methods
    .swapSolToMove(amountIn)
    .accounts({
      globalState,
      moveToken,
      user,
      userAta,
      vault,
      vaultAta,
    })
    .instruction();
}

export async function createSwapMoveToSolInstruction(
  program: Program<MovePool>,
  user: anchor.web3.PublicKey,
  moveToken: PublicKey,
  amountIn: BN
) {
  const { globalState, vault } = getPda(program);
  const userAta = await getAssociatedTokenAddress(moveToken, user);
  const vaultAta = await getAssociatedTokenAddress(moveToken, vault, true);
  return await program.methods
    .swapMoveToSol(amountIn)
    .accounts({
      globalState,
      moveToken,
      user,
      userAta,
      vault,
      vaultAta,
    })
    .instruction();
}
