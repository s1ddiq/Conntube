// hooks/useRealtimeRoom.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeRoom(roomCode: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usePolling, setUsePolling] = useState(false);

  // Get room ID and initial state
  useEffect(() => {
    const getRoomId = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}`);
        const data = await res.json();
        setRoomId(data.id);
        setIsPlaying(data.isPlaying);
        setVideoTime(data.videoTime || 0);
        console.log("Initial room state:", {
          isPlaying: data.isPlaying,
          videoTime: data.videoTime,
        });
      } catch (error) {
        console.error("Error getting room:", error);
      } finally {
        setLoading(false);
      }
    };
    if (roomCode) getRoomId();
  }, [roomCode]);

  // Subscribe to room changes using room ID
  useEffect(() => {
    if (!roomId) return;

    console.log("Setting up realtime subscription for room ID:", roomId);

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("✅ Realtime update received!", payload);
          const newData = payload.new;
          setIsPlaying(newData.isPlaying);
          setVideoTime(newData.videoTime);
          setUsePolling(false); // Realtime works, disable polling
        },
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime connected successfully!");
        } else if (status === "CHANNEL_ERROR") {
          console.log("❌ Realtime failed, switching to polling");
          setUsePolling(true);
        }
      });

    // Timeout: if no realtime update after 5 seconds, switch to polling
    const timeout = setTimeout(() => {
      console.log("⚠️ No realtime updates received, switching to polling");
      setUsePolling(true);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Polling fallback (every 2 seconds)
  useEffect(() => {
    if (!usePolling || !roomCode) return;

    console.log("🔄 Polling fallback active for room:", roomCode);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          setIsPlaying(data.isPlaying);
          setVideoTime(data.videoTime || 0);
          console.log("Polling update:", {
            isPlaying: data.isPlaying,
            videoTime: data.videoTime,
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [usePolling, roomCode]);

  return { isPlaying, videoTime, setIsPlaying, setVideoTime, loading };
}
