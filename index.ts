import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Wallet as AnchorWallet } from "@coral-xyz/anchor";
import dotenv from "dotenv";
import { TokenMint } from "./type";
import { OrcaService } from "./orca.service";

dotenv.config();

// Environment variables must be defined before script execution
// ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
// ANCHOR_WALLET=wallet.json

const connection = new Connection(
  process.env.ANCHOR_PROVIDER_URL as string,
  "confirmed"
);
const wallet = new AnchorWallet(
  Keypair.fromSecretKey(
    Uint8Array.from(
      (process.env.ANCHOR_WALLET || ",")
        .split(",")
        .map((s) => Number.parseInt(s))
    )
  )
);

// Token definition
// devToken specification
// https://everlastingsong.github.io/nebula/
const usdc: TokenMint = {
  mint: new PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"),
  decimals: 6,
  symbol: "USDC",
};

const sol: TokenMint = {
  mint: new PublicKey("So11111111111111111111111111111111111111112"),
  decimals: 9,
  symbol: "SOL",
};

const DEVNET_WHIRLPOOLS_CONFIG = new PublicKey(
  "FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"
);

async function main() {
  const orcaService = new OrcaService(
    connection,
    wallet,
    usdc,
    sol,
    DEVNET_WHIRLPOOLS_CONFIG
  );

  const amountIn = 10; // 10 USDC
  const tickSpacing = 64;

  await orcaService.executeSwap(tickSpacing, amountIn);
}

main();
