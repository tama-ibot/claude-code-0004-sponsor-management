import { NextResponse } from "next/server";
import { isSupabaseProvider } from "@/lib/auth";
import { checkSupabaseConnection } from "@/lib/supabase-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = process.env.APP_DATA_PROVIDER || "sqlite";
  const requiredSupabaseEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ORGANIZATION_ID",
  ];
  const missingSupabaseEnv = requiredSupabaseEnv.filter((key) => !process.env[key]);

  let supabase:
    | {
        ok: boolean;
        message: string;
        organizationFound: boolean;
      }
    | null = null;

  if (isSupabaseProvider() && missingSupabaseEnv.length === 0) {
    try {
      supabase = await checkSupabaseConnection();
    } catch (error) {
      supabase = {
        ok: false,
        message: error instanceof Error ? error.message : "Supabase connection failed.",
        organizationFound: false,
      };
    }
  }

  const ok = provider === "sqlite" || (missingSupabaseEnv.length === 0 && Boolean(supabase?.ok));

  return NextResponse.json(
    {
      ok,
      provider,
      environment: process.env.NODE_ENV || "development",
      authRequired: isSupabaseProvider(),
      localAuthBypass: process.env.ALLOW_LOCAL_AUTH_BYPASS === "true",
      supabase: {
        configured: missingSupabaseEnv.length === 0,
        missingEnv: missingSupabaseEnv,
        connection: supabase,
      },
    },
    {
      status: ok ? 200 : 503,
    },
  );
}
