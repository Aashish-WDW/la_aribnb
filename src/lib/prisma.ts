import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Helper to use Prisma with Clerk JWT for Supabase RLS
export const getSupabasePrisma = (token: string) => {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    // Set the JWT token in a local variable for Supabase RLS
                    await prisma.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '${token}';`);
                    return query(args);
                },
            },
        },
    });
};

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
