"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  tiktok_username: string | null;
  overlay_id: string;
};

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const cleanTikTokUsername = useMemo(() => {
    return tiktokUsername
      .trim()
      .replace(/^@/, "")
      .replace(/\s/g, "")
      .toLowerCase();
  }, [tiktokUsername]);

  const usernameIsValid = useMemo(() => {
    return /^[a-zA-Z0-9._]{2,24}$/.test(cleanTikTokUsername);
  }, [cleanTikTokUsername]);
useEffect(() => {
  const loadProfile = async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("PROFILE USER:", user);
    console.log("PROFILE USER ERROR:", userError);

    if (userError || !user) {
      setMessage("ไม่พบ session/user กรุณา login ใหม่");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,tiktok_username,overlay_id")
      .eq("id", user.id)
      .maybeSingle();

    console.log("PROFILE DATA:", data);
    console.log("PROFILE ERROR:", error);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage(`ไม่พบ profile ของ user id: ${user.id}`);
      setLoading(false);
      return;
    }

    setProfile(data);
    setDisplayName(data.display_name ?? "");
    setTiktokUsername(data.tiktok_username ?? "");
    setLoading(false);
  };

  loadProfile();
}, [supabase]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (displayName.trim().length < 2) {
      setMessage("กรุณากรอก Display Name อย่างน้อย 2 ตัวอักษร");
      return;
    }

    if (!usernameIsValid) {
      setMessage("ชื่อบัญชีใช้ได้เฉพาะตัวอักษร ตัวเลข จุด (.) และขีดล่าง (_)");
      return;
    }

    if (!profile) {
      setMessage("ไม่พบข้อมูลบัญชี กรุณา Login ใหม่");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        tiktok_username: cleanTikTokUsername,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        setMessage("Creator Username นี้ถูกใช้งานแล้ว กรุณาใช้อันอื่น");
        return;
      }

      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage("บันทึกโปรไฟล์เรียบร้อยแล้วค่ะ");
    setProfile({
      ...profile,
      display_name: displayName.trim(),
      tiktok_username: cleanTikTokUsername,
    });
  };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/dashboard"
              prefetch={false}
              className="text-sm font-bold text-pink-400"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-4xl font-black">My Profile</h1>

            <p className="mt-2 text-zinc-400">
              จัดการข้อมูลบัญชีและ Creator Username ของคุณ
            </p>
          </div>

          <a
            href="/logout"
            className="w-fit rounded-xl bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600"
          >
            Logout
          </a>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Email</div>
            <div className="mt-2 break-all font-bold">
              {loading ? "Loading..." : profile?.email}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="text-sm text-zinc-400">Overlay ID</div>
            <div className="mt-2 break-all text-sm font-bold text-zinc-300">
              {loading ? "Loading..." : profile?.overlay_id}
            </div>
          </div>
        </section>

        <form
          onSubmit={saveProfile}
          className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8 shadow-2xl shadow-pink-500/10"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Display Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="เช่น Mimi หรือ Heal Jai Travel"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none transition focus:border-pink-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-300">
                Creator Username
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  @
                </span>

                <input
                  type="text"
                  value={tiktokUsername}
                  onChange={(event) => setTiktokUsername(event.target.value)}
                  placeholder="healjaitravel"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 pl-9 outline-none transition focus:border-pink-500"
                />
              </div>

              {tiktokUsername.length > 0 && (
                <p
                  className={`mt-2 text-sm ${
                    usernameIsValid ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {usernameIsValid
                    ? `✅ จะบันทึกเป็น @${cleanTikTokUsername}`
                    : "❌ ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด และขีดล่าง"}
                </p>
              )}
            </div>

            {message && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  success
                    ? "border-green-500 bg-green-500/10 text-green-200"
                    : "border-red-500 bg-red-500/10 text-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-xl bg-pink-600 p-4 font-bold transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
