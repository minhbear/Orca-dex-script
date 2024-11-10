import { AnchorProvider, Wallet as AnchorWallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { TokenMint } from "./type";
import {
  buildWhirlpoolClient,
  IGNORE_CACHE,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
  SwapQuote,
  swapQuoteByInputToken,
  Whirlpool,
  WhirlpoolClient,
  WhirlpoolContext,
} from "@orca-so/whirlpools-sdk";
import { DecimalUtil, Percentage } from "@orca-so/common-sdk";
import Decimal from "decimal.js";

export class OrcaService {
  protected provider: AnchorProvider;
  protected tokenInMint: TokenMint;
  protected tokenOutMint: TokenMint;
  protected whirlpoolCtx: WhirlpoolContext;
  protected whirlpoolClient: WhirlpoolClient;
  protected whirlpoolsConfig: PublicKey;

  constructor(
    connection: Connection,
    wallet: AnchorWallet,
    tokenInMint: TokenMint,
    tokenOutMint: TokenMint,
    whirlpoolsConfig: PublicKey
  ) {
    this.provider = new AnchorProvider(connection, wallet, {});
    this.tokenInMint = tokenInMint;
    this.tokenOutMint = tokenOutMint;
    this.whirlpoolCtx = WhirlpoolContext.withProvider(
      this.provider,
      ORCA_WHIRLPOOL_PROGRAM_ID
    );
    this.whirlpoolClient = buildWhirlpoolClient(this.whirlpoolCtx);
    this.whirlpoolsConfig = whirlpoolsConfig;

    console.log("endpoint:", this.whirlpoolCtx.connection.rpcEndpoint);
    console.log(
      "wallet pubkey:",
      this.whirlpoolCtx.wallet.publicKey.toBase58()
    );
  }

  async executeSwap(tickSpacing: number, amountIn: number) {
    const { quote, whirlpool } = await this.getSwapQuote(tickSpacing, amountIn);

    // Send the transaction
    const tx = await whirlpool.swap(quote);
    const signature = await tx.buildAndExecute();
    console.log("signature:", signature);

    // Wait for the transaction to complete
    const latest_blockhash =
      await this.whirlpoolCtx.connection.getLatestBlockhash();
    await this.whirlpoolCtx.connection.confirmTransaction(
      { signature, ...latest_blockhash },
      "confirmed"
    );
  }

  async getSwapQuote(
    tickSpacing: number,
    amountIn: number
  ): Promise<{
    quote: SwapQuote;
    whirlpool: Whirlpool;
  }> {
    const whirlPoolPubkey = PDAUtil.getWhirlpool(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      this.whirlpoolsConfig,
      this.tokenOutMint.mint,
      this.tokenInMint.mint,
      tickSpacing
    ).publicKey;

    console.log("🚀 whirlPoolPubkey:", whirlPoolPubkey.toBase58());
    const whirlpool = await this.whirlpoolClient.getPool(whirlPoolPubkey);

    const quote = await swapQuoteByInputToken(
      whirlpool,
      // Input token and amount
      this.tokenInMint.mint,
      DecimalUtil.toBN(new Decimal(amountIn), this.tokenInMint.decimals),
      // Acceptable slippage (10/1000 = 1%)
      Percentage.fromFraction(10, 1000),
      this.whirlpoolCtx.program.programId,
      this.whirlpoolCtx.fetcher,
      IGNORE_CACHE
    );

    // Output the estimation
    console.log(
      "estimatedAmountIn:",
      DecimalUtil.fromBN(
        quote.estimatedAmountIn,
        this.tokenInMint.decimals
      ).toString(),
      `${this.tokenInMint.symbol}`
    );
    console.log(
      "estimatedAmountOut:",
      DecimalUtil.fromBN(
        quote.estimatedAmountOut,
        this.tokenOutMint.decimals
      ).toString(),
      `${this.tokenOutMint.symbol}`
    );
    console.log(
      "otherAmountThreshold:",
      DecimalUtil.fromBN(
        quote.otherAmountThreshold,
        this.tokenOutMint.decimals
      ).toString(),
      `${this.tokenOutMint.symbol}`
    );

    return { quote, whirlpool };
  }
}
