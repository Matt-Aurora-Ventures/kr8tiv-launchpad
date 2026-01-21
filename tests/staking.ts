import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Staking } from "../target/types/staking";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.Staking as Program<Staking>;
const connection = provider.connection;
const wallet = provider.wallet as anchor.Wallet;

const DAY = 24 * 60 * 60;
const MIN_LOCK = 7 * DAY;
const MAX_LOCK = 365 * DAY;
const DECIMALS = 9;
const BPS = new anchor.BN(10000);
const MIN_MULT = new anchor.BN(10000);
const MAX_MULT = new anchor.BN(20000);

const ONE = new anchor.BN(1_000_000_000);
const HOLDER = ONE.muln(1000);
const PREMIUM = ONE.muln(10_000);
const VIP = ONE.muln(100_000);

const feeBpsByTier: Record<string, number> = {
  NONE: 500,
  HOLDER: 400,
  PREMIUM: 200,
  VIP: 0,
};

function bnToBigInt(value: anchor.BN): bigint {
  return BigInt(value.toString());
}

function weightMultiplier(
  lockDuration: number,
  minLock: number,
  maxLock: number
): anchor.BN {
  const duration = Math.max(Math.min(lockDuration, maxLock), minLock);
  const range = maxLock - minLock;
  if (range === 0) return MIN_MULT;
  const progressBps = new anchor.BN(duration - minLock)
    .mul(BPS)
    .div(new anchor.BN(range));
  const multiplierRange = MAX_MULT.sub(MIN_MULT);
  return MIN_MULT.add(multiplierRange.mul(progressBps).div(BPS));
}

function expectedWeighted(
  amount: anchor.BN,
  lockDuration: number,
  minLock: number,
  maxLock: number
): anchor.BN {
  const mult = weightMultiplier(lockDuration, minLock, maxLock);
  return amount.mul(mult).div(BPS);
}

function parseTier(tier: unknown): string {
  if (!tier) return "UNKNOWN";
  if (typeof tier === "string") return tier.toUpperCase();
  if (typeof tier === "number") {
    const names = ["NONE", "HOLDER", "PREMIUM", "VIP"];
    return names[tier] || "UNKNOWN";
  }
  const keys = Object.keys(tier as Record<string, unknown>);
  return keys.length ? keys[0].toUpperCase() : "UNKNOWN";
}

async function airdrop(pubkey: PublicKey, sol = 2): Promise<void> {
  const sig = await connection.requestAirdrop(
    pubkey,
    sol * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(sig, "confirmed");
}

function getStakePoolPda(stakeMint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake_pool"), stakeMint.toBuffer()],
    program.programId
  )[0];
}

function getStakeVaultPda(stakePool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake_vault"), stakePool.toBuffer()],
    program.programId
  )[0];
}

function getRewardVaultPda(stakePool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("reward_vault"), stakePool.toBuffer()],
    program.programId
  )[0];
}

function getUserStakePda(stakePool: PublicKey, user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_stake"), stakePool.toBuffer(), user.toBuffer()],
    program.programId
  )[0];
}

async function setupPool(params?: {
  minLock?: number;
  maxLock?: number;
  rewardRate?: anchor.BN;
}) {
  const minLock = params?.minLock ?? MIN_LOCK;
  const maxLock = params?.maxLock ?? MAX_LOCK;
  const rewardRate = params?.rewardRate ?? new anchor.BN(1000);

  const stakeMint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey,
    null,
    DECIMALS
  );
  const rewardMint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey,
    null,
    DECIMALS
  );

  const stakePool = getStakePoolPda(stakeMint);
  const stakeVault = getStakeVaultPda(stakePool);
  const rewardVault = getRewardVaultPda(stakePool);

  await program.methods
    .initialize({
      rewardRate,
      minLockDuration: new anchor.BN(minLock),
      maxLockDuration: new anchor.BN(maxLock),
    })
    .accounts({
      authority: wallet.publicKey,
      stakePool,
      stakeMint,
      rewardMint,
      stakeVault,
      rewardVault,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  await mintTo(
    connection,
    wallet.payer,
    rewardMint,
    rewardVault,
    wallet.publicKey,
    bnToBigInt(new anchor.BN(1_000_000_000_000))
  );

  return {
    stakeMint,
    rewardMint,
    stakePool,
    stakeVault,
    rewardVault,
    minLock,
    maxLock,
    rewardRate,
  };
}

async function createUserWithTokens(
  stakeMint: PublicKey,
  amount: anchor.BN
) {
  const user = Keypair.generate();
  await airdrop(user.publicKey, 2);

  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    stakeMint,
    user.publicKey
  );

  await mintTo(
    connection,
    wallet.payer,
    stakeMint,
    userTokenAccount.address,
    wallet.publicKey,
    bnToBigInt(amount)
  );

  return { user, userTokenAccount };
}

async function getStakeEvent(signature: string) {
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
  });
  if (!tx?.meta?.logMessages) {
    throw new Error("Missing transaction logs");
  }
  const parser = new anchor.EventParser(program.programId, program.coder);
  const events: Array<{ name: string; data: unknown }> = [];
  parser.parseLogs(tx.meta.logMessages, (event) => {
    events.push(event);
  });
  const stakeEvent = events.find((event) => event.name === "StakeEvent");
  if (!stakeEvent) {
    throw new Error("StakeEvent not found");
  }
  return stakeEvent;
}

describe("staking", () => {
  it("initializes stake pool with valid parameters", async () => {
    const pool = await setupPool({
      minLock: MIN_LOCK,
      maxLock: MAX_LOCK,
      rewardRate: new anchor.BN(500),
    });

    const stakePool = await program.account.stakePool.fetch(pool.stakePool);

    expect(stakePool.authority.equals(wallet.publicKey)).to.equal(true);
    expect(stakePool.stakeMint.equals(pool.stakeMint)).to.equal(true);
    expect(stakePool.rewardMint.equals(pool.rewardMint)).to.equal(true);
    expect(stakePool.stakeVault.equals(pool.stakeVault)).to.equal(true);
    expect(stakePool.rewardVault.equals(pool.rewardVault)).to.equal(true);
    expect(stakePool.totalStaked.toNumber()).to.equal(0);
    expect(stakePool.totalWeightedStake.toNumber()).to.equal(0);
    expect(stakePool.rewardRate.eq(new anchor.BN(500))).to.equal(true);
    expect(stakePool.minLockDuration.toNumber()).to.equal(MIN_LOCK);
    expect(stakePool.maxLockDuration.toNumber()).to.equal(MAX_LOCK);
    expect(stakePool.paused).to.equal(false);
  });

  it("stakes with various lock durations", async () => {
    const pool = await setupPool();
    const durations = [7, 30, 90, 180, 365].map((d) => d * DAY);
    const amount = HOLDER;

    for (const duration of durations) {
      const { user, userTokenAccount } = await createUserWithTokens(
        pool.stakeMint,
        amount
      );
      const userStake = getUserStakePda(pool.stakePool, user.publicKey);

      await program.methods
        .stake(amount, new anchor.BN(duration))
        .accounts({
          user: user.publicKey,
          stakePool: pool.stakePool,
          userStake,
          userTokenAccount: userTokenAccount.address,
          stakeVault: pool.stakeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const userStakeAccount = await program.account.userStake.fetch(userStake);
      const expected = expectedWeighted(amount, duration, pool.minLock, pool.maxLock);
      expect(userStakeAccount.stakedAmount.eq(amount)).to.equal(true);
      expect(userStakeAccount.weightedStake.eq(expected)).to.equal(true);
    }
  });

  it("calculates weight multiplier correctly", async () => {
    const pool = await setupPool();
    const duration = 180 * DAY;
    const amount = ONE.muln(500);

    const { user, userTokenAccount } = await createUserWithTokens(
      pool.stakeMint,
      amount
    );
    const userStake = getUserStakePda(pool.stakePool, user.publicKey);

    await program.methods
      .stake(amount, new anchor.BN(duration))
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userStakeAccount = await program.account.userStake.fetch(userStake);
    const expected = expectedWeighted(amount, duration, pool.minLock, pool.maxLock);
    expect(userStakeAccount.weightedStake.eq(expected)).to.equal(true);
  });

  it("assigns tiers correctly and matches fee discounts", async () => {
    const pool = await setupPool();
    const cases = [
      { amount: HOLDER.subn(1), tier: "NONE", feeBps: 500 },
      { amount: HOLDER, tier: "HOLDER", feeBps: 400 },
      { amount: PREMIUM, tier: "PREMIUM", feeBps: 200 },
      { amount: VIP, tier: "VIP", feeBps: 0 },
    ];

    for (const testCase of cases) {
      const { user, userTokenAccount } = await createUserWithTokens(
        pool.stakeMint,
        testCase.amount
      );
      const userStake = getUserStakePda(pool.stakePool, user.publicKey);

      const sig = await program.methods
        .stake(testCase.amount, new anchor.BN(pool.minLock))
        .accounts({
          user: user.publicKey,
          stakePool: pool.stakePool,
          userStake,
          userTokenAccount: userTokenAccount.address,
          stakeVault: pool.stakeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const event = await getStakeEvent(sig);
      const tier = parseTier((event.data as { newTier: unknown }).newTier);
      expect(tier).to.equal(testCase.tier);
      expect(feeBpsByTier[tier]).to.equal(testCase.feeBps);
    }
  });

  it("prevents unstake before lock expires", async () => {
    const pool = await setupPool();
    const amount = ONE.muln(100);
    const { user, userTokenAccount } = await createUserWithTokens(
      pool.stakeMint,
      amount
    );
    const userStake = getUserStakePda(pool.stakePool, user.publicKey);

    await program.methods
      .stake(amount, new anchor.BN(MIN_LOCK))
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    let threw = false;
    try {
      await program.methods
        .unstake(amount)
        .accounts({
          user: user.publicKey,
          stakePool: pool.stakePool,
          userStake,
          userTokenAccount: userTokenAccount.address,
          stakeVault: pool.stakeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
    } catch (error) {
      threw = true;
      expect(String(error)).to.include("StillLocked");
    }

    expect(threw).to.equal(true);
  });

  it("allows unstake after lock expires", async () => {
    const pool = await setupPool({ minLock: 0 });
    const amount = ONE.muln(100);
    const { user, userTokenAccount } = await createUserWithTokens(
      pool.stakeMint,
      amount
    );
    const userStake = getUserStakePda(pool.stakePool, user.publicKey);

    await program.methods
      .stake(amount, new anchor.BN(1))
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    await program.methods
      .unstake(amount)
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const userStakeAccount = await program.account.userStake.fetch(userStake);
    expect(userStakeAccount.stakedAmount.toNumber()).to.equal(0);
    const tokenAccount = await getAccount(connection, userTokenAccount.address);
    expect(tokenAccount.amount).to.equal(bnToBigInt(amount));
  });

  it("claims staking rewards", async () => {
    const pool = await setupPool({ minLock: 0, rewardRate: new anchor.BN(1000) });
    const amount = ONE.muln(1000);
    const { user, userTokenAccount } = await createUserWithTokens(
      pool.stakeMint,
      amount
    );
    const userRewardAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      pool.rewardMint,
      user.publicKey
    );
    const userStake = getUserStakePda(pool.stakePool, user.publicKey);

    await program.methods
      .stake(amount, new anchor.BN(0))
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    await program.methods
      .claimRewards()
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userRewardAccount: userRewardAccount.address,
        rewardVault: pool.rewardVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const userStakeAccount = await program.account.userStake.fetch(userStake);
    expect(userStakeAccount.totalClaimed.toNumber()).to.be.greaterThan(0);
    const rewardAccount = await getAccount(connection, userRewardAccount.address);
    expect(rewardAccount.amount).to.be.greaterThan(0n);
  });

  it("allows multiple stakes and extends lock", async () => {
    const pool = await setupPool();
    const amountOne = ONE.muln(500);
    const amountTwo = ONE.muln(750);
    const { user, userTokenAccount } = await createUserWithTokens(
      pool.stakeMint,
      amountOne.add(amountTwo)
    );
    const userStake = getUserStakePda(pool.stakePool, user.publicKey);

    await program.methods
      .stake(amountOne, new anchor.BN(MIN_LOCK))
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const before = await program.account.userStake.fetch(userStake);

    await program.methods
      .stake(amountTwo, new anchor.BN(30 * DAY))
      .accounts({
        user: user.publicKey,
        stakePool: pool.stakePool,
        userStake,
        userTokenAccount: userTokenAccount.address,
        stakeVault: pool.stakeVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const after = await program.account.userStake.fetch(userStake);
    expect(after.stakedAmount.eq(amountOne.add(amountTwo))).to.equal(true);
    expect(after.lockEndTime.gt(before.lockEndTime)).to.equal(true);
    expect(after.lockDuration.toNumber()).to.equal(30 * DAY);
  });
});
