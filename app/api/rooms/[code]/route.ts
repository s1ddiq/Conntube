// app/api/rooms/[code]/route.ts
import { db } from "@/lib/drizzle";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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

    const { userId } = await auth();
    const isHost = room.hostId === userId;

    console.log(
      "GET - isHost:",
      isHost,
      "hostId:",
      room.hostId,
      "userId:",
      userId,
    );

    return NextResponse.json({
      ...room,
      isHost,
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json({ error: "Failed to get room" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { isPlaying, videoTime, currentVideoUrl, videoType, videoId } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };
    if (isPlaying !== undefined) updateData.isPlaying = isPlaying;
    if (videoTime !== undefined) updateData.videoTime = videoTime;
    if (currentVideoUrl !== undefined)
      updateData.currentVideoUrl = currentVideoUrl;
    if (videoType !== undefined) updateData.videoType = videoType;
    if (videoId !== undefined) updateData.videoId = videoId;

    const [updated] = await db
      .update(rooms)
      .set(updateData)
      .where(eq(rooms.roomCode, code))
      .returning();

    const { userId } = await auth();
    const isHost = updated.hostId === userId;

    console.log(
      "PUT - isHost:",
      isHost,
      "hostId:",
      updated.hostId,
      "userId:",
      userId,
    );

    return NextResponse.json({
      ...updated,
      isHost,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 },
    );
  }
}
