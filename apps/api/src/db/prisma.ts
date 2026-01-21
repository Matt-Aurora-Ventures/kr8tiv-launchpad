import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;

// Helper to handle BigInt serialization for JSON responses
export function serializeBigInt<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "bigint") {
      (result as Record<string, unknown>)[key] = result[key].toString();
    } else if (result[key] && typeof result[key] === "object") {
      (result as Record<string, unknown>)[key] = serializeBigInt(
        result[key] as Record<string, unknown>
      );
    }
  }
  return result;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
