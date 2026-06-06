"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function signIn() {
    setMessage("");
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef1f4] p-6 text-[#172026]">
      <section className="w-full max-w-[420px] rounded-md border border-[#d9dee3] bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607080]">Sponsorship Management</p>
          <h1 className="mt-2 text-2xl font-semibold">ログイン</h1>
          <p className="mt-2 text-sm text-[#607080]">スポンサーシップ商品管理ツールにアクセスします。</p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            メールアドレス
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="mt-1 h-10 w-full rounded-md border border-[#ccd3da] px-3 text-sm outline-none focus:border-[#172026]"
            />
          </label>
          <label className="block text-sm font-semibold">
            パスワード
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-1 h-10 w-full rounded-md border border-[#ccd3da] px-3 text-sm outline-none focus:border-[#172026]"
            />
          </label>
          {message && <p className="rounded-md bg-[#fff4e6] px-3 py-2 text-sm text-[#8a4b00]">{message}</p>}
          <button
            onClick={signIn}
            disabled={isPending || !email || !password}
            className="h-10 w-full rounded-md bg-[#172026] px-4 text-sm font-semibold text-white hover:bg-[#2b3741] disabled:cursor-not-allowed disabled:bg-[#9aa5ae]"
          >
            {isPending ? "ログイン中" : "ログイン"}
          </button>
        </div>
      </section>
    </main>
  );
}
