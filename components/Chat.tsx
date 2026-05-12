// components/Chat.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  memberId: string;
  memberName: string;
  memberImage: string;
  createdAt: string;
}

interface ChatProps {
  roomCode: string;
}

export default function Chat({ roomCode }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isLoaded } = useUser();

  // Get user's display name properly from Clerk
  const getUserName = () => {
    if (!isLoaded || !user) return "Guest";
    return (
      user.fullName ||
      user.firstName ||
      user.username ||
      user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      "Family Member"
    );
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const userName = getUserName();

      const res = await fetch(`/api/rooms/${roomCode}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage.trim(),
          userName: userName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
        toast.success("Message sent!");
      } else {
        console.error("Error response:", data);
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const getDisplayName = (message: Message) => {
    if (message.memberId === user?.id) {
      return "You";
    }
    if (
      message.memberName &&
      message.memberName !== "Anonymous" &&
      message.memberName !== "Guest"
    ) {
      return message.memberName;
    }
    if (message.memberId && message.memberId !== "anonymous") {
      return `User_${message.memberId.slice(-6)}`;
    }
    return "Family Member";
  };

  const formatMessageTime = (dateString: string | null | undefined) => {
    if (!dateString) return "just now";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "just now";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "just now";
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation! 💬
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent/20"
                style={
                  msg.memberImage
                    ? {
                        backgroundImage: `url(${msg.memberImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {!msg.memberImage && <User className="w-4 h-4 text-accent" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">
                    {getDisplayName(msg)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 break-words">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          maxLength={500}
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
