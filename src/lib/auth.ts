import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type AppRole = "sales" | "manager" | "ops" | "admin";

export type AppProfile = {
  id: string;
  organizationId: string;
  displayName: string;
  role: AppRole;
};

type SupabaseCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function isSupabaseProvider() {
  return process.env.APP_DATA_PROVIDER === "supabase";
}

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  if (!url || !anonKey) {
    throw new Error("Supabase auth is enabled but NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items: SupabaseCookie[]) {
        try {
          items.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies; middleware refreshes the session.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  if (!isSupabaseProvider()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getCurrentProfile(): Promise<AppProfile | null> {
  if (!isSupabaseProvider()) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: String(data.id),
    organizationId: String(data.organization_id || ""),
    displayName: String(data.display_name || user.email || "ユーザー"),
    role: String(data.role || "sales") as AppRole,
  };
}

export async function requireRole(allowedRoles: AppRole[]) {
  if (!isSupabaseProvider()) {
    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_AUTH_BYPASS === "true") return null;
    throw new Error("本番環境ではSupabase認証が必要です。");
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("ログインが必要です。");
  }
  if (!allowedRoles.includes(profile.role)) {
    throw new Error("この操作を行う権限がありません。");
  }
  return profile;
}
