// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  LogIn,
  Monitor,
  Users,
  History,
  Video,
  ArrowRight,
  Play,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const recentRooms = [
    { code: "ABC123", name: "Movie Night 🍿", date: "2 hours ago" },
    { code: "XYZ789", name: "Weekly Catch-up", date: "Yesterday" },
  ];

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[url(/poster1.jpg)] text-white relative flex-center">
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Header */}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 z-40 relative">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Watch Together, Anywhere
          </h2>
          <p className="text-lg max-w-2xl mx-auto">
            Share YouTube or Google Drive links and watch with family in perfect
            sync
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12 p-4 border">
          {/* Create Room Card */}
          <Link href="/create" className="group">
            <div className="bg-transparent backdrop-blur-sm border rounded-2xl p-6  transition-all hover:scale-[1.02] cursor-pointer">
              <div className="bg-primary/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create a Room</h3>
              <p className="text-gray-400 text-sm">
                Start a new watch party and invite family
              </p>
              <div className="mt-4 flex items-center gap-1 text-white group-hover:gap-2 transition-all">
                <span className="text-sm">Get started</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Join Room Card */}
          <div className="bg-transparent backdrop-blur-sm border rounded-2xl p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 " />
            </div>
            <h3 className="text-xl font-semibold  mb-3">Join a Room</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                maxLength={6}
                className="bg-input"
              />
              <Button onClick={handleJoinRoom} disabled={!roomCode}>
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="mb-12 text-center flex flex-col justify-center w-full">
          <h2 className="text-4xl font-bold mb-6">Supported Platforms</h2>
          <div className="flex gap-6 justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Play className="w-5 h-5 text-red-500" />
              <span className="text-sm text-white">YouTube</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Video className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-white">Google Drive</span>
            </div>
          </div>
        </div>

        {/* Recent Rooms Section */}
        {/* {recentRooms.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Recent Rooms
            </h2>
            <div className="space-y-2">
              {recentRooms.map((room) => (
                <Link key={room.code} href={`/room/${room.code}`}>
                  <div className="bg-card hover:bg-accent rounded-lg p-3 flex justify-between items-center transition cursor-pointer">
                    <div>
                      <p className=" font-medium">{room.name}</p>
                      <p className="text-xs text-white">
                        Code: {room.code}
                      </p>
                    </div>
                    <p className="text-xs text-white">{room.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )} */}

        {/* How it works section */}
      </main>
    </div>
  );
}
