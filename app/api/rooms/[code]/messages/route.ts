// app/api/rooms/[code]/messages/route.ts
import { db } from "@/lib/drizzle";
import { chatMessages, rooms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.roomCode, code),
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.roomId, room.id),
      orderBy: desc(chatMessages.createdAt),
      limit: 100,
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { userId } = await auth();
    const { code } = await params;
    const { message, userName } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const room = await db.query.rooms.findFirst({
      where: eq(rooms.roomCode, code),
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Use the provided userName or fallback to Clerk user info
    let finalUserName = userName;
    if (
      !finalUserName ||
      finalUserName === "Anonymous" ||
      finalUserName === "Guest"
    ) {
      if (userId) {
        // Try to get user info from Clerk
        try {
          const userRes = await fetch(
            `https://api.clerk.com/v1/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
              },
            },
          );
          const userData = await userRes.json();
          finalUserName =
            userData?.first_name ||
            userData?.username ||
            `User_${userId.slice(-6)}`;
        } catch {
          finalUserName = `User_${userId.slice(-6)}`;
        }
      } else {
        finalUserName = "Family Member";
      }
    }

    const memberImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalUserName)}&background=8b5cf6&color=fff`;

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        roomId: room.id,
        memberId: userId || "anonymous",
        memberName: finalUserName,
        memberImage: memberImage,
        message: message.trim(),
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 },
    );
  }
}
