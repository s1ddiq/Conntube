// app/api/verify-access/route.ts
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { rateLimiters } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Get IP address for rate limiting
    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0] || "unknown";

    // Apply rate limiting - 5 attempts per 15 minutes
    const { success, limit, reset, remaining } =
      await rateLimiters.auth.limit(ip);

    if (!success) {
      return Response.json(
        {
          error: `Too many attempts. Please try again in ${Math.ceil((reset - Date.now()) / 1000 / 60)} minutes.`,
          remaining: 0,
          limit,
          resetAt: new Date(reset).toISOString(),
        },
        { status: 429 },
      );
    }

    const { password } = await req.json();
    const validPassword = process.env.FAMILY_ACCESS_PASSWORD;

    if (!validPassword) {
      console.error("FAMILY_ACCESS_PASSWORD not set in environment");
      return Response.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    if (password === validPassword) {
      const cookieStore = await cookies();

      cookieStore.set("family_access", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return Response.json({
        success: true,
        remaining,
        limit,
      });
    }

    return Response.json(
      {
        error: `Incorrect password. ${remaining} attempts remaining.`,
        remaining,
        limit,
      },
      { status: 401 },
    );
  } catch (error) {
    console.error("Rate limit error:", error);
    return Response.json(
      { error: "Server error. Please try again." },
      { status: 500 },
    );
  }
}
