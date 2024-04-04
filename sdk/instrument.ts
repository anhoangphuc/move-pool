import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import { getPda } from "./pda";
import { getAssociatedTokenAddress } from "@solana/spl-token";

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
export async function createDepositInstruction(
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
