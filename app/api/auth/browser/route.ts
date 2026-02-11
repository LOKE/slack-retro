import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken, generateSessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify the auth token
    const payload = verifyAuthToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Generate session token with 4-hour expiry
    const sessionToken = generateSessionToken(
      payload.userId,
      payload.userName,
      payload.teamId
    );

    // Create response redirecting to the retro board
    const response = NextResponse.redirect(new URL("/retro", request.url));

    // Set HTTP-only, secure cookie
    response.cookies.set("retro_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 4 * 60 * 60, // 4 hours in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in auth/browser:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
