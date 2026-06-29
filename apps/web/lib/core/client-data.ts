import { createClient } from "@/lib/supabase/client";
import type { Profile, Subscription, WidgetSettings } from "./types";

export async function getCurrentUserClient() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    user,
    error,
  };
}

export async function getProfileClient(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,tiktok_username,overlay_id,created_at")
    .eq("id", userId)
    .single();

  return {
    profile: data as Profile | null,
    error,
  };
}

export async function getSubscriptionClient(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,user_id,plan,status,started_at,expires_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    subscription: data as Subscription | null,
    error,
  };
}

export async function getWidgetSettingsClient(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("widget_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  return {
    settings: data as WidgetSettings | null,
    error,
  };
}
