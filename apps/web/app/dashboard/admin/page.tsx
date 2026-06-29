"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createToast,
  ToastMessage,
  ToastStack,
} from "@/components/ui/ToastStack";

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  tiktok_username: string | null;
  overlay_id: string;
  created_at: string;
  role: string;
  subscription: {
    plan: string;
    status: string;
    started_at: string | null;
    expires_at: string | null;
  } | null;
};

type AdminStats = {
  total: number;
  trial: number;
  pro: number;
  premium: number;
  invalidPlan: number;
  ownerRole: number;
  adminRole: number;
  supportRole: number;
  active: number;
  disabled: number;
};

type AuditLog = {
  id: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  action: string;
  details: {
    target_email?: string;
  } | null;
  created_at: string;
};

type AdminAction =
  | "make_trial"
  | "extend_trial"
  | "make_pro"
  | "make_premium"
  | "disable"
  | "role_user"
  | "role_admin"
  | "role_support"
  | "role_owner";

const ACTION_LABELS: Record<AdminAction, string> = {
  make_trial: "🎁 รีเซ็ต Trial 9 วัน",
  extend_trial: "➕ เพิ่ม Trial 9 วัน",
  make_pro: "⭐ เปลี่ยนเป็น Pro",
  make_premium: "💎 เปลี่ยนเป็น Premium",
  disable: "🚫 ปิดการใช้งาน",
  role_user: "👤 ตั้ง Role เป็น User",
  role_admin: "🛠️ ตั้ง Role เป็น Admin",
  role_support: "🎧 ตั้ง Role เป็น Support",
  role_owner: "👑 ตั้ง Role เป็น Owner",
};

function normalizePlan(plan: string | undefined | null) {
  if (plan === "pro") return "pro";
  if (plan === "premium") return "premium";

  return "trial";
}

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [workingUserId, setWorkingUserId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToasts((prev) => [...prev, createToast(message, type)]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const plan = normalizePlan(user.subscription?.plan);
      const status = user.subscription?.status || "none";
      const role = user.role || "user";

      const matchedKeyword =
        !keyword ||
        user.email?.toLowerCase().includes(keyword) ||
        user.display_name?.toLowerCase().includes(keyword) ||
        user.tiktok_username?.toLowerCase().includes(keyword) ||
        role.toLowerCase().includes(keyword);

      const matchedFilter =
        filter === "all" ||
        plan === filter ||
        role === filter ||
        status === filter;

      return matchedKeyword && matchedFilter;
    });
  }, [filter, search, users]);

  const loadUsers = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    setCurrentUserId(session.user.id);

    const res = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      pushToast(data?.error || "ไม่สามารถโหลด Admin ได้", "error");
      setLoading(false);
      return;
    }

    const data = await res.json();

    setUsers(data.users || []);
    setStats(data.stats || null);
    setAuditLogs(data.auditLogs || []);
    setLoading(false);
  };

  const runAction = async (user: AdminUser, action: AdminAction) => {
    const label = ACTION_LABELS[action];
    const isSelf = user.id === currentUserId;
    const isChangingOwnOwnerRole =
      isSelf &&
      (action === "role_user" ||
        action === "role_admin" ||
        action === "role_support");

    if (isSelf && action === "disable") {
      pushToast("ไม่สามารถ Disable บัญชีตัวเองได้", "error");
      return;
    }

    let confirmation: string | undefined;

    if (isChangingOwnOwnerRole) {
      confirmation = prompt(
        `⚠️ คุณกำลังถอดสิทธิ์ Owner ของตัวเอง\n\nถ้ายืนยัน คุณอาจเข้า Admin ไม่ได้อีก\n\nพิมพ์ CONFIRM เพื่อดำเนินการ`,
      ) || undefined;

      if (confirmation !== "CONFIRM") {
        pushToast("ยกเลิกการทำรายการ", "info");
        return;
      }
    } else {
      const ok = confirm(
        `${label}\n\nบัญชี: ${user.email}\n\nยืนยันการทำรายการนี้หรือไม่?`,
      );

      if (!ok) return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    setWorkingUserId(user.id);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId: user.id,
        action,
        confirmation,
      }),
    });

    setWorkingUserId("");

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      pushToast(data?.error || "อัปเดตไม่สำเร็จ", "error");
      return;
    }

    pushToast(`${label} สำเร็จ`, "success");
    await loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <ToastStack toasts={toasts} removeToast={removeToast} />

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-black text-yellow-300">
              👑 Owner Role Access
            </div>

            <h1 className="mt-2 text-4xl font-black">
              OMSW Live Admin
            </h1>

            <p className="mt-2 text-zinc-400">
              Plan ใช้คุมแพ็กเกจ / Role ใช้คุมสิทธิ์หลังบ้าน
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="w-fit rounded-xl bg-zinc-800 px-5 py-3 font-bold transition hover:bg-zinc-700"
          >
            Refresh
          </button>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-4 xl:grid-cols-9">
          <StatCard label="Users" value={stats?.total ?? 0} />
          <StatCard label="Trial" value={stats?.trial ?? 0} />
          <StatCard label="Pro" value={stats?.pro ?? 0} />
          <StatCard label="Premium" value={stats?.premium ?? 0} />
          <StatCard label="Invalid Plan" value={stats?.invalidPlan ?? 0} />
          <StatCard label="Owner Role" value={stats?.ownerRole ?? 0} />
          <StatCard label="Support" value={stats?.supportRole ?? 0} />
          <StatCard label="Active" value={stats?.active ?? 0} />
          <StatCard label="Disabled" value={stats?.disabled ?? 0} />
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-zinc-950 p-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search email, display name, Creator Account, role..."
            className="w-full rounded-xl border border-zinc-700 bg-black p-4 outline-none transition focus:border-pink-500"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "all",
              "trial",
              "pro",
              "premium",
              "owner",
              "admin",
              "support",
              "active",
              "cancelled",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                  filter === item
                    ? "bg-pink-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8 text-zinc-400">
            Loading users...
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const plan = normalizePlan(user.subscription?.plan);
              const rawPlan = user.subscription?.plan || "none";
              const status = user.subscription?.status || "none";
              const expiresAt = user.subscription?.expires_at;
              const isSelf = user.id === currentUserId;
              const invalidPlan =
                rawPlan !== "none" &&
                rawPlan !== "trial" &&
                rawPlan !== "pro" &&
                rawPlan !== "premium";

              return (
                <div
                  key={user.id}
                  className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6"
                >
                  <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] xl:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-2xl font-black">
                          {user.display_name || "No name"}
                        </div>

                        {isSelf && (
                          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-black text-yellow-200">
                            YOU
                          </span>
                        )}

                        {invalidPlan && (
                          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-200">
                            INVALID PLAN: {rawPlan}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 break-all text-sm text-zinc-400">
                        {user.email}
                      </div>

                      <div className="mt-2 text-sm text-yellow-300">
                        {user.tiktok_username
                          ? `@${user.tiktok_username}`
                          : "No Creator Account"}
                      </div>

                      <div className="mt-3 break-all rounded-xl bg-black p-3 text-xs text-zinc-500">
                        Overlay ID: {user.overlay_id}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <div className="text-sm text-zinc-400">Plan</div>
                      <div className="mt-1 text-2xl font-black capitalize text-pink-300">
                        {plan}
                      </div>

                      <div className="mt-4 text-sm text-zinc-400">Status</div>
                      <div
                        className={`mt-1 font-bold capitalize ${
                          status === "active"
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {status}
                      </div>

                      <div className="mt-4 text-sm text-zinc-400">Expires</div>
                      <div className="mt-1 text-sm text-zinc-300">
                        {expiresAt ? new Date(expiresAt).toLocaleString() : "-"}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <div className="text-sm text-zinc-400">Role</div>
                      <div className="mt-1 text-2xl font-black capitalize text-yellow-300">
                        {user.role}
                      </div>

                      <div className="mt-3 text-xs text-zinc-500">
                        Role ใช้สำหรับสิทธิ์ Admin ไม่เกี่ยวกับ Plan ลูกค้า
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 text-sm font-bold text-zinc-400">
                          Plan Actions
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "make_trial")}
                          >
                            🎁 Trial
                          </ActionButton>

                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "extend_trial")}
                          >
                            ➕ +9d
                          </ActionButton>

                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "make_pro")}
                          >
                            ⭐ Pro
                          </ActionButton>

                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "make_premium")}
                          >
                            💎 Premium
                          </ActionButton>

                          <button
                            type="button"
                            disabled={workingUserId === user.id || isSelf}
                            onClick={() => runAction(user, "disable")}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            🚫 Disable
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-bold text-zinc-400">
                          Role Actions
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "role_user")}
                          >
                            👤 User
                          </ActionButton>

                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "role_support")}
                          >
                            🎧 Support
                          </ActionButton>

                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "role_admin")}
                          >
                            🛠️ Admin
                          </ActionButton>

                          <ActionButton
                            disabled={workingUserId === user.id}
                            onClick={() => runAction(user, "role_owner")}
                          >
                            👑 Owner
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
          <h2 className="text-2xl font-black">Audit Log</h2>

          <div className="mt-5 space-y-3">
            {auditLogs.length === 0 && (
              <div className="rounded-2xl bg-black p-4 text-zinc-500">
                ยังไม่มีประวัติการเปลี่ยนแปลง
              </div>
            )}

            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-white/10 bg-black p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-black text-pink-300">
                      {ACTION_LABELS[log.action as AdminAction] || log.action}
                    </div>

                    <div className="mt-1 text-sm text-zinc-400">
                      Target: {log.details?.target_email || log.target_user_id}
                    </div>
                  </div>

                  <div className="text-sm text-zinc-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
