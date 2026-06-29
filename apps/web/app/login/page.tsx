"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 text-4xl">✨</div>
          <h1 className="text-4xl font-black">Login</h1>
          <p className="mt-2 text-zinc-400">เข้าสู่ระบบ OMSW Live</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none focus:border-pink-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none focus:border-pink-500"
          />

          {message && (
            <div className="rounded-xl border border-red-500 bg-red-500/10 p-3 text-sm text-red-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-pink-600 p-4 font-bold transition hover:bg-pink-500 disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-bold text-pink-400">
            สมัครสมาชิก
          </Link>
        </div>

        <div className="mt-4 text-center text-sm">
          <Link href="/" className="text-zinc-500 hover:text-white">
            กลับหน้าแรก
          </Link>
        </div>
      </form>
    </main>
  );
}