"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Rule = {
  label: string;
  valid: boolean;
};

export default function RegisterPage() {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const emailIsValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const rules: Rule[] = useMemo(
    () => [
      {
        label: "อย่างน้อย 8 ตัวอักษร",
        valid: password.length >= 8,
      },
      {
        label: "มีตัวพิมพ์ใหญ่ A-Z",
        valid: /[A-Z]/.test(password),
      },
      {
        label: "มีตัวพิมพ์เล็ก a-z",
        valid: /[a-z]/.test(password),
      },
      {
        label: "มีตัวเลข 0-9",
        valid: /\d/.test(password),
      },
      {
        label: "มีอักขระพิเศษ เช่น ! @ # $ %",
        valid: /[^A-Za-z0-9]/.test(password),
      },
    ],
    [password],
  );

  const validRuleCount = rules.filter((rule) => rule.valid).length;
  const passwordIsStrong = validRuleCount === rules.length;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const strength = useMemo(() => {
    if (!password) {
      return {
        label: "ยังไม่ได้กรอกรหัสผ่าน",
        className: "bg-zinc-700",
        width: "0%",
        textClassName: "text-zinc-500",
      };
    }

    if (validRuleCount <= 2) {
      return {
        label: "อ่อน",
        className: "bg-red-500",
        width: "33%",
        textClassName: "text-red-300",
      };
    }

    if (validRuleCount <= 4) {
      return {
        label: "ปานกลาง",
        className: "bg-yellow-400",
        width: "66%",
        textClassName: "text-yellow-300",
      };
    }

    return {
      label: "แข็งแรงมาก",
      className: "bg-green-500",
      width: "100%",
      textClassName: "text-green-300",
    };
  }, [password, validRuleCount]);

  const formIsValid =
    displayName.trim().length >= 2 &&
    usernameIsValid &&
    emailIsValid &&
    passwordIsStrong &&
    passwordsMatch &&
    acceptedTerms;

  const generatePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*?";
    const all = upper + lower + numbers + symbols;

    const required = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    const rest = Array.from({ length: 10 }).map(
      () => all[Math.floor(Math.random() * all.length)],
    );

    const newPassword = [...required, ...rest]
      .sort(() => Math.random() - 0.5)
      .join("");

    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (displayName.trim().length < 2) {
      setMessage("กรุณากรอกชื่อที่ใช้แสดงอย่างน้อย 2 ตัวอักษร");
      return;
    }

    if (!usernameIsValid) {
      setMessage("กรุณากรอก Creator Username ให้ถูกต้อง");
      return;
    }

    if (!emailIsValid) {
      setMessage("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    if (!passwordIsStrong) {
      setMessage("รหัสผ่านยังไม่ปลอดภัยพอ กรุณาทำให้ครบทุกเงื่อนไข");
      return;
    }

    if (!passwordsMatch) {
      setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (!acceptedTerms) {
      setMessage("กรุณายอมรับ Terms of Service ก่อนสมัครใช้งาน");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          display_name: displayName.trim(),
          tiktok_username: cleanTikTokUsername,
        },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("duplicate")) {
        setMessage("Creator Username นี้ถูกใช้งานแล้ว กรุณาใช้อันอื่น");
        return;
      }

      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage("สมัครสำเร็จค่ะ กรุณาเช็กอีเมลเพื่อยืนยันบัญชี");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10 text-white">
      <form
        onSubmit={register}
        className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-zinc-950 p-8 shadow-2xl shadow-pink-500/10"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🚀</div>

          <h1 className="text-4xl font-black">Create Account</h1>

          <p className="mt-2 text-zinc-400">
            สมัครใช้งาน OMSW Live และเริ่มทดลองใช้ฟรี 9 วัน
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Display Name
            </label>

            <input
              type="text"
              placeholder="เช่น Mimi หรือ Heal Jai Travel"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
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
                placeholder="healjaitravel"
                value={tiktokUsername}
                onChange={(event) => setTiktokUsername(event.target.value)}
                required
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

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Email
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none transition focus:border-pink-500"
            />

            {email.length > 0 && !emailIsValid && (
              <p className="mt-2 text-sm text-red-300">
                กรุณากรอกอีเมลให้ถูกต้อง
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-bold text-zinc-300">
                Password
              </label>

              <button
                type="button"
                onClick={generatePassword}
                className="text-sm font-bold text-pink-400 transition hover:text-pink-300"
              >
                🎲 Generate Strong Password
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 pr-24 outline-none transition focus:border-pink-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 transition hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${strength.className}`}
                  style={{ width: strength.width }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Password strength</span>
                <span className={`font-bold ${strength.textClassName}`}>
                  {strength.label}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-2">
              {rules.map((rule) => (
                <div
                  key={rule.label}
                  className={`text-sm ${
                    rule.valid ? "text-green-300" : "text-zinc-500"
                  }`}
                >
                  {rule.valid ? "✅" : "○"} {rule.label}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-300">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 pr-24 outline-none transition focus:border-pink-500"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 transition hover:text-white"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <p
                className={`mt-2 text-sm ${
                  passwordsMatch ? "text-green-300" : "text-red-300"
                }`}
              >
                {passwordsMatch
                  ? "✅ รหัสผ่านตรงกัน"
                  : "❌ รหัสผ่านไม่ตรงกัน"}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300 transition hover:border-pink-500/50">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 accent-pink-600"
            />

            <span>
              ฉันยอมรับ{" "}
              <Link href="/terms" className="font-bold text-pink-400">
                Terms of Service
              </Link>{" "}
              และ{" "}
              <Link href="/privacy" className="font-bold text-pink-400">
                Privacy Policy
              </Link>{" "}
              ของ OMSW Live
            </span>
          </label>

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
            disabled={loading || !formIsValid}
            className="w-full rounded-xl bg-pink-600 p-4 font-bold transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "กำลังสมัคร..." : "Create Account"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-bold text-pink-400">
            Login
          </Link>
        </div>

        <div className="mt-4 text-center text-sm">
          <Link href="/" className="text-zinc-500 transition hover:text-white">
            กลับหน้าแรก
          </Link>
        </div>
      </form>
    </main>
  );
}
