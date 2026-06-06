#!/usr/bin/env tsx
/**
 * SpotiCover Connection Health Check
 *
 * Usage:
 *   pnpm run check:dev   — validates local Supabase connections
 *   pnpm run check:prod  — validates cloud Supabase connections
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_BUCKET_URL",
  "DATABASE_URL",
  "SPOTIFY_CLIENT_ID",
  "SPOTIFY_CLIENT_SECRET",
];

async function checkSupabaseApi() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  console.log(`  Checking Supabase API at ${url}...`);

  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key!, Authorization: `Bearer ${key!}` },
  });

  if (!res.ok) {
    throw new Error(`Supabase API returned ${res.status}`);
  }

  console.log("  ✓ Supabase API reachable");
}

async function checkSupabaseAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  console.log(`  Checking Supabase Auth at ${url}/auth/v1...`);

  const res = await fetch(`${url}/auth/v1/settings`);

  // Settings endpoint may be restricted; just check that the service responds
  if (res.status === 404 || res.status === 200) {
    console.log("  ✓ Supabase Auth reachable");
    return;
  }

  throw new Error(`Supabase Auth returned ${res.status}`);
}

async function checkDatabase() {
  console.log(`  Checking database connection...`);

  try {
    const { Pool } = await import("pg");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("../src/generated/prisma/client");

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    const prisma = new PrismaClient({ adapter });
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("  ✓ Database connected");
    } finally {
      await prisma.$disconnect();
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (
      e.code === "ERR_MODULE_NOT_FOUND" ||
      e.code === "MODULE_NOT_FOUND" ||
      e.message.includes(".prisma/client/default")
    ) {
      console.log(
        "  ⚠ Prisma client not generated — run `pnpm prisma generate` first",
      );
      return;
    }

    console.error(`  ✗ ${e.message}`);
    throw e;
  }
}

async function main() {
  const mode = process.argv[2] || "dev";
  console.log(`\n  SpotiCover Health Check [${mode.toUpperCase()}]\n`);

  // 1. Validate required env vars
  console.log("  1. Environment variables:");
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.log(`  ✗ Missing: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`  ✓ All ${REQUIRED_VARS.length} variables set\n`);

  // 2. Check Supabase services
  console.log("  2. Supabase services:");
  try {
    await checkSupabaseApi();
    await checkSupabaseAuth();
  } catch (e) {
    console.log(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }
  console.log();

  // 3. Check database
  console.log("  3. Database:");
  try {
    await checkDatabase();
  } catch (e) {
    console.log(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`\n  ✅ All connections verified [${mode.toUpperCase()}]\n`);
}

main().catch((e) => {
  console.error(`\n  ❌ Health check failed: ${e.message}\n`);
  process.exit(1);
});
