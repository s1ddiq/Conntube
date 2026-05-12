// app/room/[code]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
        setRoom(data);
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
            if (timeDiff > 2 && data.videoTime > 0) {
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
    <div className="h-full overflow-hidden bg-cover">
      <Image
        src="/poster1.jpg"
        alt="Background"
        fill
        className="object-cover object-center -z-1"
        priority
      />
      <div className="z-1 absolute top-0 left-0 bg-black/80 w-full h-full"></div>

      {/* Responsive Layout - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col lg:flex-row h-full relative z-2 overflow-y-auto lg:overflow-hidden">
        {/* Video Section - Takes full width on mobile, flexible on desktop */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden">
          {/* Video Player Container */}
          <div className="relative w-full">
            <div
              className={`${!room?.isHost && "pointer-events-none"} bg-black rounded-xl overflow-hidden shadow-2xl aspect-video`}
            >
              <YouTubePlayer
                videoId={room.videoId}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onStateChange={handleStateChange}
              />
            </div>

            {/* Host badge overlay on mobile */}
            {room?.isHost && (
              <div className="absolute top-2 right-2 lg:hidden">
                <span className="flex items-center gap-1 text-xs bg-yellow-500/90 text-yellow-500 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Crown className="w-3 h-3" />
                  Host
                </span>
              </div>
            )}
          </div>

          {/* Room Info Bar - Responsive */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <h2 className="font-bold text-lg sm:text-xl md:text-2xl text-foreground truncate max-w-[200px] sm:max-w-none">
                {room.roomName}
              </h2>
              <p
                onClick={() => copyRoomLink()}
                className="text-xs text-accent cursor-pointer hover:text-accent/50 shrink-0"
              >
                Code: {room.roomCode} 📋
              </p>
              {room?.isHost && (
                <span className="hidden lg:flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3" />
                  Host
                </span>
              )}
            </div>

            {/* Action Buttons - Responsive grid */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {room?.isHost && (
                <Button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {showUrlInput ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Edit2 className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">
                    {showUrlInput ? "Cancel" : "Change Video"}
                  </span>
                </Button>
              )}

              <Button
                onClick={manualSync}
                variant="outline"
                size="sm"
                disabled={isSyncingManually}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncingManually ? "animate-spin" : ""}`}
                />
                <span className="ml-2 hidden sm:inline">
                  {isSyncingManually ? "Syncing..." : "Sync"}
                </span>
              </Button>

              <Button
                onClick={copyRoomLink}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {copied ? "Copied!" : "Invite"}
                </span>
              </Button>
            </div>
          </div>

          {/* Change Video URL Input */}
          {showUrlInput && room?.isHost && (
            <div className="mt-3 bg-card rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-2">
                Paste new YouTube or Google Drive URL:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1"
                  disabled={changingUrl}
                />
                <Button
                  onClick={changeVideoUrl}
                  disabled={changingUrl || !newVideoUrl.trim()}
                  className="w-full sm:w-auto"
                >
                  {changingUrl ? "Changing..." : "Change"}
                </Button>
              </div>
            </div>
          )}

          {/* Video URL - Hide on mobile to save space */}
          <p className="text-xs text-muted-foreground mt-2 truncate hidden sm:block">
            {room.currentVideoUrl}
          </p>
        </div>

        {/* Right Sidebar - Full width on mobile, fixed width on desktop */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-border overflow-hidden mt-4 lg:mt-0">
          {/* Chat Section */}
          <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 min-h-[300px] lg:min-h-0">
            <h3 className="font-semibold text-white mb-3">Family Chat</h3>
            <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card p-2">
              <Chat roomCode={room.roomCode} />
            </div>
          </div>

          {/* Video Controls */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-white">Video Controls</h3>
              {!room?.isHost && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Host Only
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground hidden sm:block">
              {room?.isHost
                ? "You are the host. Control the video for everyone."
                : "Only the host can control the video. Sit back and enjoy!"}
            </p>

            {/* Control Buttons - Responsive grid */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleSeek(-10)}
                variant="outline"
                disabled={!room?.isHost}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">-10s</span>
              </Button>

              <Button
                onClick={handlePlayPause}
                disabled={!room?.isHost}
                className="w-full"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
                <span className="hidden sm:inline ml-2">
                  {isPlaying ? "Pause" : "Play"}
                </span>
              </Button>

              <Button
                onClick={() => handleSeek(10)}
                variant="outline"
                disabled={!room?.isHost}
                className="w-full"
              >
                <span className="hidden sm:inline mr-1">+10s</span>
                <RotateCcw className="w-4 h-4 rotate-180" />
              </Button>
            </div>

            {/* Time Display */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono">
                {Math.floor(currentTime / 60)}:
                {(currentTime % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
