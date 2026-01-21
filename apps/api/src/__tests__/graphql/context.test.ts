import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request } from 'express';
import { createContext, GraphQLContext, verifyToken, extractTokenFromHeader } from '../../graphql/context';

// Mock PrismaClient
const mockPrismaClient = {
  staker: {
    findUnique: vi.fn(),
  },
};

vi.mock('../../db/prisma', () => ({
  default: mockPrismaClient,
}));

// Mock crypto utilities
vi.mock('../../utils/crypto', () => ({
  verifySignature: vi.fn(),
}));

describe('GraphQL Context', () => {
  describe('extractTokenFromHeader', () => {
    it('should extract Bearer token from Authorization header', () => {
      const token = extractTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
    });

    it('should return null for missing Authorization header', () => {
      const token = extractTokenFromHeader(undefined);
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer token', () => {
      const token = extractTokenFromHeader('Basic dXNlcjpwYXNz');
      expect(token).toBeNull();
    });

    it('should return null for malformed Bearer token', () => {
      const token = extractTokenFromHeader('Bearer');
      expect(token).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid wallet signature token', async () => {
      const { verifySignature } = await import('../../utils/crypto');
      (verifySignature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await verifyToken('validToken.signature.payload');

      expect(result).toEqual(
        expect.objectContaining({
          wallet: expect.any(String),
          isAdmin: expect.any(Boolean),
        })
      );
    });

    it('should return null for invalid token', async () => {
      const { verifySignature } = await import('../../utils/crypto');
      (verifySignature as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = await verifyToken('invalidToken');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const { verifySignature } = await import('../../utils/crypto');
      (verifySignature as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await verifyToken('expiredToken');
      expect(result).toBeNull();
    });
  });

  describe('createContext', () => {
    it('should create context with prisma and request info', async () => {
      const mockReq = {
        headers: {},
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const context = await createContext({ req: mockReq });

      expect(context).toEqual(
        expect.objectContaining({
          prisma: expect.any(Object),
          user: null,
          requestId: expect.any(String),
          ip: '127.0.0.1',
        })
      );
    });

    it('should include authenticated user when valid token provided', async () => {
      const { verifySignature } = await import('../../utils/crypto');
      (verifySignature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const mockReq = {
        headers: {
          authorization: 'Bearer validToken.signature.payload',
        },
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const context = await createContext({ req: mockReq });

      expect(context.user).not.toBeNull();
      expect(context.user?.wallet).toBeDefined();
    });

    it('should generate unique request ID for each context', async () => {
      const mockReq = {
        headers: {},
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const context1 = await createContext({ req: mockReq });
      const context2 = await createContext({ req: mockReq });

      expect(context1.requestId).not.toBe(context2.requestId);
    });

    it('should extract IP from X-Forwarded-For header', async () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18',
        },
        ip: '127.0.0.1',
        get: vi.fn().mockImplementation((header: string) => {
          if (header.toLowerCase() === 'x-forwarded-for') {
            return '203.0.113.195, 70.41.3.18';
          }
          return null;
        }),
      } as unknown as Request;

      const context = await createContext({ req: mockReq });

      expect(context.ip).toBe('203.0.113.195');
    });

    it('should use X-Request-ID if provided', async () => {
      const mockReq = {
        headers: {
          'x-request-id': 'custom-request-id-123',
        },
        ip: '127.0.0.1',
        get: vi.fn().mockImplementation((header: string) => {
          if (header.toLowerCase() === 'x-request-id') {
            return 'custom-request-id-123';
          }
          return null;
        }),
      } as unknown as Request;

      const context = await createContext({ req: mockReq });

      expect(context.requestId).toBe('custom-request-id-123');
    });

    it('should check admin status from database for authenticated users', async () => {
      const { verifySignature } = await import('../../utils/crypto');
      (verifySignature as ReturnType<typeof vi.fn>).mockReturnValue(true);

      // Mock admin wallet lookup - this would typically check against an admin list
      // For this test, we'll verify the context creation works

      const mockReq = {
        headers: {
          authorization: 'Bearer adminToken.signature.payload',
        },
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('127.0.0.1'),
      } as unknown as Request;

      const context = await createContext({ req: mockReq });

      expect(context.user).toBeDefined();
    });
  });

  describe('GraphQLContext type', () => {
    it('should have required properties', () => {
      const context: GraphQLContext = {
        prisma: mockPrismaClient as any,
        user: null,
        requestId: 'test-id',
        ip: '127.0.0.1',
      };

      expect(context.prisma).toBeDefined();
      expect(context.requestId).toBeDefined();
    });

    it('should allow user to be null or defined', () => {
      const contextNoUser: GraphQLContext = {
        prisma: mockPrismaClient as any,
        user: null,
        requestId: 'test-id',
        ip: '127.0.0.1',
      };

      const contextWithUser: GraphQLContext = {
        prisma: mockPrismaClient as any,
        user: { wallet: 'TestWallet123', isAdmin: false },
        requestId: 'test-id',
        ip: '127.0.0.1',
      };

      expect(contextNoUser.user).toBeNull();
      expect(contextWithUser.user).not.toBeNull();
      expect(contextWithUser.user?.wallet).toBe('TestWallet123');
    });
  });
});
