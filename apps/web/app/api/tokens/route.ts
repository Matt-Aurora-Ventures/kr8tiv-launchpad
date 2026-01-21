import { NextRequest, NextResponse } from 'next/server';

// Types for token data
interface Token {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image?: string;
  creator: string;
  supply: number;
  decimals: number;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  progress: number;
  isGraduated: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  tokenomics: {
    creatorAllocation: number;
    lpAllocation: number;
    airdropAllocation: number;
    vestingPeriod: number;
  };
}

// Mock database - replace with actual DB connection
const tokens: Map<string, Token> = new Map();

// GET /api/tokens - List all tokens with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const filter = searchParams.get('filter'); // trending, new, graduating, graduated
    const search = searchParams.get('search');
    const creator = searchParams.get('creator');

    let tokenList = Array.from(tokens.values());

    // Apply filters
    if (filter) {
      switch (filter) {
        case 'trending':
          tokenList = tokenList.filter((t) => t.priceChange24h > 0);
          break;
        case 'new':
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          tokenList = tokenList.filter(
            (t) => new Date(t.createdAt).getTime() > oneDayAgo
          );
          break;
        case 'graduating':
          tokenList = tokenList.filter(
            (t) => !t.isGraduated && t.progress >= 70
          );
          break;
        case 'graduated':
          tokenList = tokenList.filter((t) => t.isGraduated);
          break;
      }
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      tokenList = tokenList.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.symbol.toLowerCase().includes(searchLower) ||
          t.mint.toLowerCase().includes(searchLower)
      );
    }

    // Filter by creator
    if (creator) {
      tokenList = tokenList.filter((t) => t.creator === creator);
    }

    // Sort
    tokenList.sort((a, b) => {
      const aValue = a[sort as keyof Token];
      const bValue = b[sort as keyof Token];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'desc' ? bValue - aValue : aValue - bValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'desc'
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      return 0;
    });

    // Paginate
    const total = tokenList.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    tokenList = tokenList.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: tokenList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Create a new token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      symbol,
      description,
      image,
      creator,
      supply,
      decimals = 9,
      metadata = {},
      tokenomics,
    } = body;

    // Validation
    if (!name || !symbol || !creator || !supply) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, symbol, creator, supply',
        },
        { status: 400 }
      );
    }

    if (symbol.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Symbol must be 10 characters or less' },
        { status: 400 }
      );
    }

    // Generate mock mint address (in production, this would be created on-chain)
    const mint = `${symbol.toUpperCase()}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 44);

    const newToken: Token = {
      mint,
      name,
      symbol: symbol.toUpperCase(),
      description: description || '',
      image,
      creator,
      supply,
      decimals,
      price: 0,
      priceChange24h: 0,
      marketCap: 0,
      volume24h: 0,
      holders: 1,
      progress: 0,
      isGraduated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      tokenomics: tokenomics || {
        creatorAllocation: 10,
        lpAllocation: 80,
        airdropAllocation: 10,
        vestingPeriod: 30,
      },
    };

    tokens.set(mint, newToken);

    return NextResponse.json(
      {
        success: true,
        data: newToken,
        message: 'Token created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create token' },
      { status: 500 }
    );
  }
}
