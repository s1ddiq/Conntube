// app/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateRoomPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          roomName: roomName || `${user?.firstName}'s Party`,
          hostId: user?.id,
          videoType: videoUrl.includes("youtube") ? "youtube" : "googledrive",
          videoId: videoUrl.includes("youtube")
            ? videoUrl.split("v=")[1]?.split("&")[0]
            : "",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/room/${data.roomCode}`);
      } else {
        setError(data.error || "Failed to create room");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br ">
      <div className="container mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground  mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create Watch Party</h1>
          <p className="text-muted-foreground mb-8">
            Paste a YouTube or Google Drive link to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Room Name
              </label>
              <Input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Movie Night 🍿"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video URL
              </label>
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Create Room →"
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-card/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Supported: YouTube videos & Google Drive video files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
