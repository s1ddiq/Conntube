// app/api/rooms/route.ts
import { db } from "@/lib/drizzle";
import { rooms, familyMembers } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { videoUrl, videoType, videoId, roomName } = body;

    console.log("Creating room with:", {
      userId,
      videoUrl,
      videoType,
      videoId,
      roomName,
    });

    // Check if family member exists, if not create them
    if (userId) {
      const existingMember = await db
        .select()
        .from(familyMembers)
        .where(eq(familyMembers.id, userId));

      if (!existingMember.length) {
        await db.insert(familyMembers).values({
          id: userId,
          name: "Family Member",
          isActive: true,
        });
      }
    }

    // Generate room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Insert room
    const [room] = await db
      .insert(rooms)
      .values({
        roomCode,
        hostId: userId || "anonymous",
        roomName: roomName || "Watch Party",
        currentVideoUrl: videoUrl,
        videoType: videoType || "youtube",
        videoId: videoId || "",
        isPlaying: false,
        videoTime: 0,
        volume: 100,
      })
      .returning();

    console.log("Room created:", room);

    return NextResponse.json({
      success: true,
      roomCode: room.roomCode,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room", details: `${error as any}` },
      { status: 500 },
    );
  }
}

// Optional: Handle GET requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to create a room." },
    { status: 405 },
  );
}
