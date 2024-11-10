# This is the script to swap token with Orca

### Prerequire before use
Copy the .env.example file
Fill the RPC and your wallet secret key
```
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET='9,9,9,9,...'
```

Install package
```
pnpm install
```

### Use the script
Default this script use USDC/SOL pool to handle swap with USDC is token swap and SOL it token receive

Change the amount want to swap

For interact another swap in Solana Devnet, please view this link to see what pool available to swap in Solana devnet: https://everlastingsong.github.io/nebula/