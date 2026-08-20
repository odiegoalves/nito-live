import { PrismaClient } from '@prisma/client';

// A URL do banco vem SEMPRE do ambiente.
// Nunca escreva usuario e senha aqui: este arquivo vai para o Git.
const DB_URL = process.env.DATABASE_URL;

// A Vercel injeta variaveis de Postgres automaticamente que podem
// conflitar com a nossa. Removemos para nao haver duvida de qual vale.
delete process.env.POOLER_URL;
delete process.env.POSTGRES_URL;
delete process.env.POSTGRES_PRISMA_URL;
delete process.env.POSTGRES_URL_NON_POOLING;

export const prisma = DB_URL
  ? new PrismaClient({ datasources: { db: { url: DB_URL } } })
  : new PrismaClient();
