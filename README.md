# MovePool Program

A program on Solana build and deploy on Solana testnet. The program is a simple dex that allow user can swap between SOL and Move Token at rate 1:10

# How to build
1. First you need to install Anchor. This is the framework this program based on. Follow this [link](https://book.anchor-lang.com/getting_started/installation.html) to install Anchor
2. This program is built on Solana version 1.18.9, the up-to-date version on Solana testnet.
So to build the program successfully, you first need to install Solana version 1.18.9, using this command:
 
    ` solana-install init 1.18.9
    `
3. To build the program, run the command: 
 
     `anchor build`
# How to test
To run unit test, just run the command:

`anchor test`
        

