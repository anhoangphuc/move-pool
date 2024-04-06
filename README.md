# MovePool Program

A program on Solana that built and deployed on Solana testnet. The program is a simple dex that allow user can swap between SOL and Move Token at rate 1:10

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

You can also test for swap function, by running the command:

`cargo test`
