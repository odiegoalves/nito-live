import { PrismaClient } from '@prisma/client';

const OFFICIAL_URL = "postgresql://postgres:Valora2024SaaS!@db.aoifhzglajhnifjqcfqt.supabase.co:5432/postgres";

// Deleta variáveis legadas da Vercel que tentavam usar o pooler invalido
delete process.env.POOLER_URL;
delete process.env.POSTGRES_URL;
delete process.env.POSTGRES_PRISMA_URL;
delete process.env.POSTGRES_URL_NON_POOLING;
process.env.DATABASE_URL = OFFICIAL_URL;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: OFFICIAL_URL
    }
  }
});
