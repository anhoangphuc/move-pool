import { Program } from "@coral-xyz/anchor";
import { MovePool } from "../target/types/move_pool";
import * as anchor from "@coral-xyz/anchor";
import { Config } from "./config";

export function getPda(program: Program<MovePool>) {
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

export async function getAccountData(program: Program<MovePool>) {
  const { globalState, vault } = getPda(program);
  const globalStateAccount = await program.account.globalState.fetch(
    globalState
  );
  const vaultAccount = await program.account.vault.fetch(vault);
  return { globalStateAccount, vaultAccount };
}
