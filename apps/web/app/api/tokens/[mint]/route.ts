import { NextRequest, NextResponse } from 'next/server';

// Mock database - in production, use actual DB
const tokens = new Map<string, any>();

// GET /api/tokens/[mint] - Get specific token
export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const { mint } = params;
    const token = tokens.get(mint);

    if (!token) {
      // Return mock data for demo purposes
      const mockToken = {
        mint,
        name: 'Demo Token',
        symbol: 'DEMO',
        description: 'A demonstration token on the KR8TIV Launchpad',
        price: 0.00042,
        priceChange24h: 15.5,
        marketCap: 420000,
        volume24h: 125000,
        holders: 2847,
        progress: 78,
        isGraduated: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        creator: 'Demo...Creator',
        supply: 1000000000,
        decimals: 9,
        metadata: {
          website: 'https://kr8tiv.io',
          twitter: 'https://twitter.com/kr8tiv',
          telegram: 'https://t.me/kr8tiv',
        },
        tokenomics: {
          creatorAllocation: 10,
          lpAllocation: 80,
          airdropAllocation: 10,
          vestingPeriod: 30,
        },
        priceHistory: generatePriceHistory(),
        trades: generateRecentTrades(),
        topHolders: generateTopHolders(),
      };

      return NextResponse.json({
        success: true,
        data: mockToken,
      });
    }

    return NextResponse.json({
      success: true,
      data: token,
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token' },
      { status: 500 }
    );
  }
}

// PUT /api/tokens/[mint] - Update token metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const { mint } = params;
    const body = await request.json();
    const { description, image, metadata } = body;

    let token = tokens.get(mint);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }

    // Only allow updating certain fields
    if (description !== undefined) token.description = description;
    if (image !== undefined) token.image = image;
    if (metadata !== undefined) token.metadata = { ...token.metadata, ...metadata };
    token.updatedAt = new Date().toISOString();

    tokens.set(mint, token);

    return NextResponse.json({
      success: true,
      data: token,
      message: 'Token updated successfully',
    });
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update token' },
      { status: 500 }
    );
  }
}

// DELETE /api/tokens/[mint] - Burn/remove token (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const { mint } = params;

    // In production, verify admin permissions
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!tokens.has(mint)) {
      return NextResponse.json(
        { success: false, error: 'Token not found' },
        { status: 404 }
      );
    }

    tokens.delete(mint);

    return NextResponse.json({
      success: true,
      message: 'Token removed successfully',
    });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete token' },
      { status: 500 }
    );
  }
}

// Helper functions for mock data
function generatePriceHistory() {
  const history = [];
  let price = 0.0003;
  for (let i = 24; i >= 0; i--) {
    const time = new Date(Date.now() - i * 3600000).toISOString();
    price *= 1 + (Math.random() - 0.4) * 0.1;
    history.push({
      time,
      price: parseFloat(price.toFixed(8)),
      volume: Math.floor(Math.random() * 50000) + 5000,
    });
  }
  return history;
}

function generateRecentTrades() {
  const trades = [];
  for (let i = 0; i < 20; i++) {
    const isBuy = Math.random() > 0.4;
    trades.push({
      id: `trade-${i}`,
      type: isBuy ? 'buy' : 'sell',
      amount: Math.floor(Math.random() * 1000000) + 10000,
      price: (0.0003 + Math.random() * 0.0002).toFixed(8),
      total: (Math.random() * 100 + 10).toFixed(2),
      wallet: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(Date.now() - i * 60000 * Math.random() * 10).toISOString(),
    });
  }
  return trades;
}

function generateTopHolders() {
  const holders = [];
  let remaining = 100;
  for (let i = 0; i < 10 && remaining > 0; i++) {
    const percentage = i === 0 ? 15 : Math.min(remaining, Math.random() * 10 + 2);
    remaining -= percentage;
    holders.push({
      rank: i + 1,
      wallet: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
      amount: Math.floor(percentage * 10000000),
      percentage: parseFloat(percentage.toFixed(2)),
      isCreator: i === 0,
    });
  }
  return holders;
}
