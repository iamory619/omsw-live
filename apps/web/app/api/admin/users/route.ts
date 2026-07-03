import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VALID_PLANS = ["free", "pro", "premium"] as const;
const VALID_ROLES = ["user", "support", "admin", "owner"] as const;

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace("Bearer ", "");
}

function createUserClient(accessToken: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function createAdminClient() {
  return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireOwner(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return {
      error: NextResponse.json(
        {
          error:
            "Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 },
      ),
    };
  }

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      error: NextResponse.json(
        { error: "Missing access token" },
        { status: 401 },
      ),
    };
  }

  const userClient = createUserClient(accessToken);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: "Invalid session" }, { status: 401 }),
    };
  }

  const adminClient = createAdminClient();

  const { data: roleRow, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleRow || roleRow.role !== "owner") {
    return {
      error: NextResponse.json(
        { error: "Owner role required" },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    adminClient,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireOwner(request);

  if ("error" in auth) {
    return auth.error;
  }

  const { adminClient } = auth;

  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id,email,display_name,tiktok_username,overlay_id,created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return NextResponse.json(
      { error: profilesError.message },
      { status: 500 },
    );
  }

  const { data: subscriptions, error: subscriptionsError } = await adminClient
    .from("subscriptions")
    .select("id,user_id,plan,status,started_at,expires_at,created_at")
    .order("created_at", { ascending: false });

  if (subscriptionsError) {
    return NextResponse.json(
      { error: subscriptionsError.message },
      { status: 500 },
    );
  }

  const { data: roles } = await adminClient
    .from("user_roles")
    .select("user_id,role,created_at,updated_at");

  const { data: auditLogs } = await adminClient
    .from("admin_audit_logs")
    .select("id,actor_user_id,target_user_id,action,details,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const subscriptionMap = new Map(
    (subscriptions || []).map((subscription) => [
      subscription.user_id,
      subscription,
    ]),
  );

  const roleMap = new Map((roles || []).map((role) => [role.user_id, role]));

  const users = (profiles || []).map((profile) => {
    const subscription = subscriptionMap.get(profile.id) || null;

    return {
      ...profile,
      subscription,
      role: roleMap.get(profile.id)?.role || "user",
    };
  });

  const stats = {
    total: users.length,
    free: users.filter((user) => user.subscription?.plan === "free").length,
    pro: users.filter((user) => user.subscription?.plan === "pro").length,
    premium: users.filter((user) => user.subscription?.plan === "premium")
      .length,
    invalidPlan: users.filter(
      (user) =>
        user.subscription?.plan &&
        !VALID_PLANS.includes(user.subscription.plan as any),
    ).length,
    ownerRole: users.filter((user) => user.role === "owner").length,
    adminRole: users.filter((user) => user.role === "admin").length,
    supportRole: users.filter((user) => user.role === "support").length,
    active: users.filter((user) => user.subscription?.status === "active")
      .length,
    disabled: users.filter((user) => user.subscription?.status === "cancelled")
      .length,
  };

  return NextResponse.json({
    users,
    stats,
    auditLogs: auditLogs || [],
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwner(request);

  if ("error" in auth) {
    return auth.error;
  }

  const { user: actor, adminClient } = auth;

  const body = await request.json();

  const userId = body.userId as string;
  const action = body.action as
    | "make_trial"
    | "extend_trial"
    | "make_pro"
    | "make_premium"
    | "disable"
    | "role_user"
    | "role_admin"
    | "role_support"
    | "role_owner";

  const confirmation = body.confirmation as string | undefined;

  if (!userId || !action) {
    return NextResponse.json(
      { error: "Missing userId or action" },
      { status: 400 },
    );
  }

  const isSelfAction = actor.id === userId;
  const isChangingSelfOwnerRole =
    isSelfAction &&
    (action === "role_user" ||
      action === "role_admin" ||
      action === "role_support");

  if (isSelfAction && action === "disable") {
    return NextResponse.json(
      {
        error:
          "ไม่สามารถ Disable บัญชีตัวเองได้ เพื่อป้องกันการล็อกตัวเองออกจากระบบ",
      },
      { status: 400 },
    );
  }

  if (isChangingSelfOwnerRole && confirmation !== "CONFIRM") {
    return NextResponse.json(
      {
        error:
          "การถอดสิทธิ์ Owner ของตัวเองต้องพิมพ์ CONFIRM เพื่อยืนยัน",
        requireConfirmation: true,
      },
      { status: 400 },
    );
  }

  const { data: ownerRoles } = await adminClient
    .from("user_roles")
    .select("user_id")
    .eq("role", "owner");

  const ownerCount = ownerRoles?.length || 0;

  if (isChangingSelfOwnerRole && ownerCount <= 1) {
    return NextResponse.json(
      {
        error:
          "ไม่สามารถถอดสิทธิ์ Owner ได้ เพราะนี่คือ Owner คนสุดท้ายของระบบ",
      },
      { status: 400 },
    );
  }

  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("email,display_name,tiktok_username")
    .eq("id", userId)
    .single();

  const { data: previousSubscription } = await adminClient
    .from("subscriptions")
    .select("plan,status,expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: previousRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  const now = new Date();

  let detailsAfter: Record<string, unknown> = {};

  if (action.startsWith("role_")) {
    const nextRole = action.replace("role_", "");

    if (!VALID_ROLES.includes(nextRole as any)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { error: roleError } = await adminClient.from("user_roles").upsert(
      {
        user_id: userId,
        role: nextRole,
        updated_at: now.toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    detailsAfter = {
      role: nextRole,
    };
  } else {
    let payload: {
      user_id: string;
      plan: "free" | "pro" | "premium";
      status: string;
      started_at?: string;
      expires_at: string | null;
    };

    if (action === "make_trial") {
      payload = {
        user_id: userId,
        plan: "free",
        status: "active",
        started_at: now.toISOString(),
        expires_at: new Date(
          now.getTime() + 9 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } else if (action === "extend_trial") {
      const baseDate =
        previousSubscription?.expires_at &&
        new Date(previousSubscription.expires_at).getTime() > Date.now()
          ? new Date(previousSubscription.expires_at)
          : now;

      payload = {
        user_id: userId,
        plan: "free",
        status: "active",
        started_at: now.toISOString(),
        expires_at: new Date(
          baseDate.getTime() + 9 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } else if (action === "make_pro") {
      payload = {
        user_id: userId,
        plan: "pro",
        status: "active",
        started_at: now.toISOString(),
        expires_at: new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } else if (action === "make_premium") {
      payload = {
        user_id: userId,
        plan: "premium",
        status: "active",
        started_at: now.toISOString(),
        expires_at: new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    } else {
      payload = {
        user_id: userId,
        plan:
          previousSubscription?.plan === "pro" ||
          previousSubscription?.plan === "premium"
            ? previousSubscription.plan
            : "free",
        status: "cancelled",
        started_at: now.toISOString(),
        expires_at: now.toISOString(),
      };
    }

    const { error } = await adminClient.from("subscriptions").upsert(payload, {
      onConflict: "user_id",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    detailsAfter = payload;
  }

  await adminClient.from("admin_audit_logs").insert({
    actor_user_id: actor.id,
    target_user_id: userId,
    action,
    details: {
      target_email: targetProfile?.email || null,
      target_display_name: targetProfile?.display_name || null,
      target_tiktok_username: targetProfile?.tiktok_username || null,
      before: {
        subscription: previousSubscription || null,
        role: previousRole?.role || "user",
      },
      after: detailsAfter,
      safety: {
        is_self_action: isSelfAction,
        confirmation_required: isChangingSelfOwnerRole,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    action,
  });
}
