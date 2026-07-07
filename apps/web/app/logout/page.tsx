"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace("/login");
    };

    logout();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-xl font-black">Logging out...</div>
    </main>
  );
}