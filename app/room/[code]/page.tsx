// app/room/[code]/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  ArrowLeft,
  Edit2,
  X,
  Crown,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import YouTubePlayer from "@/components/VideoPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Chat from "@/components/Chat";
import Image from "next/image";

interface Room {
  id: string;
  roomCode: string;
  roomName: string;
  currentVideoUrl: string;
  videoType: string;
  videoId: string;
  isPlaying: boolean;
  videoTime: number;
  hostId: string;
  isHost: boolean; // Added to identify if current user is host
}

export default function RoomPage() {
  const { code } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [changingUrl, setChangingUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingManually, setIsSyncingManually] = useState(false);
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo(0, scrollRef.current);
    }, 0);

    return () => clearTimeout(timeout);
  }, [room, isPlaying, currentTime]);
  const extractVideoInfo = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return { type: "youtube", id: videoId };
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return { type: "youtube", id: videoId };
    }
    if (url.includes("drive.google.com")) {
      const match = url.match(/\/d\/([^/]+)/);
      const videoId = match ? match[1] : null;
      return { type: "googledrive", id: videoId };
    }
    return null;
  };

  // Fetch room details
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.ok) {
        const data = await res.json();
        setRoom((prev) => {
          if (!prev) return data;

          return {
            ...prev,
            isPlaying: data.isPlaying,
            videoTime: data.videoTime,
          };
        });

        setIsPlaying(data.isPlaying);
        setCurrentTime(data.videoTime || 0);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching room:", error);
    } finally {
      setLoading(false);
    }
  }, [code, router]);

  useEffect(() => {
    if (code) {
      fetchRoom();
    }
  }, [code, fetchRoom]);

  // Poll for updates (simple sync for now)
  useEffect(() => {
    if (!code) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (res.ok) {
          const data = await res.json();

          if (!isSyncing) {
            if (data.isPlaying !== isPlaying) {
              setIsPlaying(data.isPlaying);
            }
            const timeDiff = Math.abs(data.videoTime - currentTime);
            if (timeDiff > 0.1 && data.videoTime > 0) {
              setCurrentTime(data.videoTime);
            }
          }
        }
      } catch (error) {
        console.error("Error syncing room:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [code, isPlaying, currentTime, isSyncing]);

  const updateRoomState = async (playing: boolean, time: number) => {
    if (!room?.isHost) {
      toast.error("Only the host can control the video");
      return;
    }

    setIsSyncing(true);
    try {
      await fetch(`/api/rooms/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPlaying: playing,
          videoTime: Math.floor(time),
        }),
      });
    } catch (error) {
      console.error("Error updating room:", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 100);
    }
  };

  const manualSync = async () => {
    setIsSyncingManually(true);
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
        setIsPlaying(data.isPlaying);
        setCurrentTime(data.videoTime || 0);
        router.refresh(); // Force re-render to sync video player
        // window.location.reload(); // Force full page reload to ensure everything is in sync
        toast.success("Synced with host!");
        console.log("Manual sync completed:", {
          isPlaying: data.isPlaying,
          videoTime: data.videoTime,
        });
      } else {
        toast.error("Failed to sync");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Failed to sync");
    } finally {
      setIsSyncingManually(false);
    }
  };

  const changeVideoUrl = async () => {
    if (!room?.isHost) {
      toast.error("Only the host can change the video");
      return;
    }

    if (!newVideoUrl.trim()) return;

    const videoInfo = extractVideoInfo(newVideoUrl);
    if (!videoInfo || !videoInfo.id) {
      toast.error("Invalid YouTube or Google Drive URL");
      return;
    }

    setChangingUrl(true);
    try {
      const res = await fetch(`/api/rooms/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentVideoUrl: newVideoUrl,
          videoType: videoInfo.type,
          videoId: videoInfo.id,
          videoTime: 0,
          isPlaying: false,
        }),
      });

      if (res.ok) {
        const updatedRoom = await res.json();
        setRoom(updatedRoom);
        setCurrentTime(0);
        setIsPlaying(false);
        setNewVideoUrl("");
        setShowUrlInput(false);
        toast.success("Video changed successfully!");
      } else {
        toast.error("Failed to change video");
      }
    } catch (error) {
      console.error("Error changing video:", error);
      toast.error("Failed to change video");
    } finally {
      setChangingUrl(false);
    }
  };

  const handlePlayPause = () => {
    if (!room?.isHost) {
      toast.error("Only the host can control playback");
      return;
    }
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    updateRoomState(newPlaying, currentTime);
  };

  const handleStateChange = (playing: boolean, time: number) => {
    if (!room?.isHost) return;
    setIsPlaying(playing);
    setCurrentTime(time);
    updateRoomState(playing, time);
  };

  const handleSeek = (seconds: number) => {
    if (!room?.isHost) {
      toast.error("Only the host can seek");
      return;
    }
    const newTime = Math.max(0, currentTime + seconds);
    setCurrentTime(newTime);
    updateRoomState(isPlaying, newTime);
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Room link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Room not found</p>
          <Link href="/" className="text-accent hover:text-accent/50">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      {/* BACKGROUND */}
      <Image
        src="/poster1.jpg"
        alt="Background"
        fill
        className="object-cover object-center -z-10"
        priority
      />
      <div className="absolute inset-0 bg-black/80 z-0" />

      {/* MAIN WRAPPER */}
      <div className="relative z-10 h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* ================= LEFT / VIDEO ================= */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* VIDEO */}
          <div className="p-2 sm:p-3 lg:p-4 shrink-0">
            <div className="aspect-video bg-black rounded-xl shadow-2xl overflow-hidden">
              <YouTubePlayer
                videoId={room.videoId}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onStateChange={handleStateChange}
              />
            </div>
          </div>

          {/* URL INPUT */}
        </div>

        {/* ================= RIGHT / SIDEBAR ================= */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-background backdrop-blur-md lg:h-full">
          {/* ROOM INFO (always visible) */}
          <div className="p-3 lg:p-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold truncate">{room.roomName}</h2>

              <p
                onClick={copyRoomLink}
                className="text-xs text-accent cursor-pointer"
              >
                {room.roomCode} 📋
              </p>
            </div>
          </div>

          {/* CHAT (THIS is the only scroll area) */}
          {/* In your room page - the chain from parent to child must have height constraints */}
          <div className="flex-1 flex flex-col p-3 sm:p-4 h-full justify-end gap-6">
            <div className="">
              {room.isHost ? (
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">You are the host</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    You are a viewer. Enjoy the show! 🍿
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 justify-center flex-wrap">
              {room.isHost && (
                <>
                  <Button
                    onClick={() => setShowUrlInput((prev) => !prev)}
                    variant="outline"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Change Video URL
                  </Button>
                  {showUrlInput && room?.isHost && (
                    <div className="px-3 pb-3 lg:px-4 lg:pb-4 shrink-0">
                      <div className="bg-card rounded-lg p-3 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Paste new YouTube or Google Drive URL:
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            disabled={changingUrl}
                          />
                          <Button
                            onClick={changeVideoUrl}
                            disabled={changingUrl || !newVideoUrl.trim()}
                          >
                            {changingUrl ? "Changing..." : "Change"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}{" "}
              <Button onClick={manualSync} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync
              </Button>
              <div className="flex gap-2 mt-3">
                <Button onClick={copyRoomLink} variant="outline" size="sm">
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Room Link
                </Button>
              </div>
            </div>
            {/* min-h-0 is key */}
            <h3 className="font-semibold text-foreground mb-3 shrink-0">
              Family Chat 💬
            </h3>
            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card p-2 max-h-[500px]">
              <Chat roomCode={room.roomCode} />
            </div>
          </div>
          {/* CONTROLS */}
          <div className="border-t border-border p-3 lg:p-4 shrink-0">
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleSeek(-10)}
                disabled={!room?.isHost}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button onClick={handlePlayPause} disabled={!room?.isHost}>
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <Button
                onClick={() => handleSeek(10)}
                disabled={!room?.isHost}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 rotate-180" />
              </Button>
            </div>

            <p className="text-xs text-center mt-2 text-muted-foreground font-mono">
              {Math.floor(currentTime / 60)}:
              {(currentTime % 60).toString().padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
