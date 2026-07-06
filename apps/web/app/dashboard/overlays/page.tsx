"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  overlay_id: string;
};

const WIDGETS = [
  { name: "Gift Goal", emoji: "🎁", path: "/widget/gift-goal" },
  {
    name: "Magic Lantern",
    emoji: "🧙",
    path: "/widget/magic-lantern",
    query: "?lantern=phoenix",
  },
  {
    name: "Gift Vehicle",
    emoji: "🛺",
    path: "/widget/gift-vehicle",
    query: "?vehicle=tuktuk",
  },
  {
    name: "Gift Basket",
    emoji: "🧺",
    path: "/widget/gift-plane",
    query: "?basket=basket-1",
  },
  { name: "Fortune Stick", emoji: "🙏", path: "/widget/fortune-stick" },
];

export default function OverlayUrlsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setOrigin(window.location.origin);

      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const retry = await supabase.auth.getSession();
        session = retry.data.session;
      }

      if (!session?.user) {
        setLoading(false);
        window.location.href = "/login";
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profileData) {
        setLoading(false);
        alert("Profile not found. Please try logging in again.");
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    loadData();
  }, [supabase]);

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    alert("OBS overlay link copied successfully!");
  };

  return (
    <main className="min-h-screen bg-black p-6 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          badge="OBS Overlays"
          title="Copy Your OBS Browser Source Links"
          description="Copy and manage your OMSW Live overlay links for OBS Studio."
        />

        {loading ? (
          <LoadingCard />
        ) : (
          <div className="space-y-4">
            {WIDGETS.map((widget) => {
              const url = `${origin}${widget.path}/${profile?.overlay_id || ""}${
                widget.query || ""
              }`;

              return (
                <Card key={widget.name}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-black">
                        {widget.emoji} {widget.name}
                      </h2>

                      <div className="mt-3 break-all rounded-2xl bg-black p-4 text-sm text-zinc-300">
                        {url}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => copy(url)} variant="secondary">
                        Copy Link
                      </Button>

                      <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        prefetch={false}
                        className="rounded-xl bg-zinc-700 px-4 py-3 font-black transition hover:bg-zinc-600"
                      >
                        Open Preview
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}