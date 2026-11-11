import { PrismaClient } from "@prisma/client";
import { prismaDatabaseUrl } from "./db-url";

const prismaClientSingleton = () => new PrismaClient({ datasourceUrl: prismaDatabaseUrl() });

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
