import { PublicKey } from "@solana/web3.js";

export interface TokenMint {
  mint: PublicKey,
  decimals: number,
  symbol: string
}