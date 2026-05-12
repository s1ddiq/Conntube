// hooks/useRealtimeChat.ts
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Message {
  id: string;
  message: string;
  memberId: string;
  memberName: string;
  memberImage: string;
  createdAt: string;
}

export function useRealtimeChat(roomCode: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get room ID and fetch initial messages
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get room ID
        const res = await fetch(`/api/rooms/${roomCode}`);
        const data = await res.json();
        setRoomId(data.id);

        // Fetch initial messages
        const messagesRes = await fetch(`/api/rooms/${roomCode}/messages`);
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roomCode) {
      initialize();
    }
  }, [roomCode]);

  // Subscribe to new messages
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { messages, setMessages, loading };
}
