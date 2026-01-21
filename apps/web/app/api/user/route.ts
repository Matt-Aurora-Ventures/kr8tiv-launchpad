import { NextRequest, NextResponse } from 'next/server';

// Types for user data
interface User {
  wallet: string;
  username?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    tokensLaunched: number;
    totalVolume: number;
    totalPnl: number;
    tradesCount: number;
    referralsCount: number;
    achievements: number;
  };
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  referralCode: string;
  referredBy?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
}

// Mock database
const users = new Map<string, User>();

// GET /api/user - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Get wallet from auth header or query
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet') || extractWalletFromAuth(authHeader);

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    let user = users.get(wallet);

    // Auto-create user if not exists
    if (!user) {
      user = createDefaultUser(wallet);
      users.set(wallet, user);
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/user - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, username, avatar, bio, preferences, socials } = body;

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    let user = users.get(wallet);
    if (!user) {
      user = createDefaultUser(wallet);
    }

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json(
          { success: false, error: 'Username must be 3-20 characters' },
          { status: 400 }
        );
      }
      // Check for duplicate username
      const existingUser = Array.from(users.values()).find(
        (u) => u.username?.toLowerCase() === username.toLowerCase() && u.wallet !== wallet
      );
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 400 }
        );
      }
      user.username = username;
    }

    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio?.slice(0, 500); // Max 500 chars
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (socials) user.socials = { ...user.socials, ...socials };
    user.updatedAt = new Date().toISOString();

    users.set(wallet, user);

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// POST /api/user - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, referralCode } = body;

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    if (users.has(wallet)) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    const user = createDefaultUser(wallet);

    // Process referral
    if (referralCode) {
      const referrer = Array.from(users.values()).find(
        (u) => u.referralCode === referralCode
      );
      if (referrer) {
        user.referredBy = referrer.wallet;
        referrer.stats.referralsCount++;
        referrer.points += 100; // Bonus points for referral
        users.set(referrer.wallet, referrer);
      }
    }

    users.set(wallet, user);

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// Helper functions
function extractWalletFromAuth(authHeader: string | null): string | null {
  if (!authHeader) return null;
  // In production, verify JWT and extract wallet
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1]; // Mock: using wallet as token
  }
  return null;
}

function createDefaultUser(wallet: string): User {
  return {
    wallet,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      tokensLaunched: 0,
      totalVolume: 0,
      totalPnl: 0,
      tradesCount: 0,
      referralsCount: 0,
      achievements: 0,
    },
    preferences: {
      notifications: true,
      emailAlerts: false,
      theme: 'system',
    },
    socials: {},
    referralCode: generateReferralCode(),
    tier: 'bronze',
    points: 0,
  };
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'KR8';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
