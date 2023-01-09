# XEN Mint ICS Generator

This is a simple script that generates an ICS (Calendar) file for XEN unlocks given a list of accounts.

Currently, it supports the following blockchains, but should be trivial to add more:
- Ethereum
- Avalanche
- Fantom

## Requirements

- NodeJS
- RPC endpoint for each blockchain (https://infura.io/ is an option to get these) 

## Usage

1. Create `.env` file based on `example.env` with the appropriate RPC URL values.
2. Create an `accounts.txt` with the addresses of the accounts you want to track (one per line).
3. Run `yarn install` or `npm install` to install dependencies.
4. Run `node index.js` to generate the ICS file.
