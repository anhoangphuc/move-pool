# MovePool Program

A program on Solana that built and deployed on Solana testnet. The program is a simple dex that allow user can swap between SOL and MOVE Token at rate 1:10

## MOVE token
 
MOVE token is a SPL-token, with decimal 7, and deployed at address:
https://solscan.io/token/618n2rrKFSGr45Lf3mnfxvdTt4zZERXM7FfSATVSjecu?cluster=testnet

Because of the [issues]( https://github.com/metaplex-foundation/mpl-token-metadata/issues/91),  so we could not create token metadata for MOVE token on the testnet. 

## MovePool program

MOVE Pool program is deployed at address:
https://solscan.io/account/AmFDUdCyJM8FAo6RrHyfQWb47bR9Ero8Px8u7KeQbhU8?cluster=testnet

The program's methods are grouped into 3 categories:
- Admin function: Only admin can call
  - `initialize`: Initialize the program after deployed
  - `set_config`: Set the config for the program
- Deposit function: Allow user to deposit assets
  - `deposit_sol`: Deposit SOL to the program
  - `deposit_move`: Deposit MOVE to the program
- Swap function: Allow user to swap between SOL and MOVE
  - `swap_sol_to_move`: Swap SOL to MOVE, at rate 1:10
  - `swap_move_to_sol`: Swap MOVE to SOL, at rate 10:1

# How to build
1. First you need to install Solana. Follow this [link](https://docs.solanalabs.com/cli/install) to install
2. Second, you need to install Anchor. This is the framework the program based on. Follow this [link](https://book.anchor-lang.com/getting_started/installation.html) to install Anchor
3. This program is built on Solana version 1.18.9, the up-to-date version on Solana testnet.
So to build the program successfully, you first need to install Solana version 1.18.9, using this command:
 
    ` solana-install init 1.18.9
    `
4. To build the program, run the command: 
 
     `anchor build`
# How to test
You first need to install required dependencies for running test. Run the command:

`yarn`

Then, build the program by following the How-to-build

To run unit test, just run the command:

`anchor test`

You can also test for swap, or deposit, withdraw function, by running the command:

`cargo test`

# How to run scripts
All the scrips are inside the folder scripts
Each script can have arguments, to customize the behavior of the script. You can see the arguments by using `--help` option.
## Deposit Sol
To deposit SOL to the program, you can run the file `scripts/deposit_sol.ts`.
The script have 2 arguments, 

- `-w` or `--wallet` : The wallet that deposit SOL to the program. You can pass the directory of the wallet, in the relative form of the `scripts` folder, or absolute form.
We already have a default `id2.json` wallet.

- `-a` or `--amount` : The amount of SOL to deposit. The amount is in SOL, not lamport. You can pass `1` for `1 SOL`, `0.1` for `0.1 SOL`, etc. The default value is 0.1

You can get more details the arguments by running the command:
`yarn ts-node scripts/deposit_sol.ts --help`

- To deposit `0.1 SOL` from the default wallet, run the command:

`yarn ts-node scripts/deposit_sol.ts`

- To deposit `0.2 SOL` from a wallet from an absolute path, run the command:

`yarn ts-node scripts/deposit_sol.ts -w /Users/hoangphuc/.config/solana/id1.json -a 0.2`

## Deposit MOVE
To deposit MOVE to the program, you can run the file `scripts/deposit_move.ts`. The script also have 2 arguments `-w` and `-a` as `src/deposit_sol.ts` script

- To deposit `1 MOVE` from the default wallet, run the command:

`yarn ts-node scripts/deposit_move.ts`

- To deposit `2 MOVE` from a wallet from an absolute path, run the command:

`yarn ts-node scripts/deposit_move.ts -w /Users/hoangphuc/.config/solana/id1.json -a 2`

## Swap SOL to MOVE
To swap SOL to MOVE, you can run the file `scripts/swap_sol_to_move.ts`. The script also have 2 arguments `-w` and `-a` as `src/deposit_sol.ts` script
- To swap `0.1 SOL` for `1 MOVE` from the default wallet, run the command:
 
`yarn ts-node scripts/swap_sol_to_move.ts`
- To swap `0.02 SOL` for `0.2 MOVE` from a wallet from an absolute path, run the command:
 
`yarn ts-node scripts/swap_sol_to_move.ts -w /Users/hoangphuc/.config/solana/id1.json -a 0.02`

## Swap MOVE to Sol
To swap MOVE to SOL, you can run the file `scripts/swap_move_to_sol.ts`. The script also have 2 arguments `-w` and `-a` as `src/deposit_sol.ts` script
- To swap `1 MOVE` for `0.1 SOL` from the default wallet, run the command:

`yarn ts-node scripts/swap_move_to_sol.ts`
- To swap `0.2 MOVE` for `0.02 SOL` from a wallet from an absolute path, run the command:

`yarn ts-node scripts/swap_move_to_sol.ts -w /Users/hoangphuc/.config/solana/id1.json -a 0.2`

## Faucet MOVE
To faucet 1000 MOVE token, you can run `scripts/2_faucet_move.ts`. The script have 1 argument:
- `-w` or `--wallet` : The wallet that receive MOVE token. You can pass the directory of the wallet, in the relative form of the `scripts` folder, or absolute form.

- To faucet 1000 MOVE token to the default wallet, run the command:
 
`yarn ts-node scripts/2_faucet_move_token.ts`