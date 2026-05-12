// app/access/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Users, Film, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Force a hard refresh to make sure middleware picks up the cookie
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Wrong password! 👨‍👩‍👧‍👦");
      }
    } catch (err) {
      setError("Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex-center bg-cover bg-center bg-[url('/ninjago-dragons-rising-poster.jpg')] p-4">
      <div className="absolute inset-0 bg-black/50 rounded-2xl z-20" />
      <div className="relative">
        {/* Animated background effect */}

        <div className="relative bg-card p-8 rounded-2xl shadow-2xl w-96 border z-30">
          <div className="text-center mb-8">
            {/* <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4">
              <Film className="w-12 h-12 text-purple-400" />
            </div> */}
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Conntube
            </h1>
            <p className="text-gray-400">Access this Watch Party 🍿</p>
            {/* <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-xs text-gray-500">
                Private Family Access
              </span>
            </div> */}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="password"
                placeholder="Enter family password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={loading}
                className="pl-10"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-3 text-center flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Enter Conntube"
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-6">
            👨‍👩‍👧‍👦 Selected individuals only, please message
            snashct.developer@gmail.com for help
          </p>
        </div>
      </div>
    </div>
  );
}
