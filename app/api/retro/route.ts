import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  getOrCreateActiveRetro,
  getDiscussionItems,
  getActionItems,
} from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(request.cookies);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active retro and its items
    const retro = await getOrCreateActiveRetro(session.teamId);
    const discussionItems = await getDiscussionItems(retro.id);
    const actionItems = await getActionItems(retro.id);

    return NextResponse.json({
      retro,
      discussionItems,
      actionItems,
      user: {
        userId: session.userId,
        userName: session.userName,
      },
    });
  } catch (error) {
    console.error("Error fetching retro data:", error);
    return NextResponse.json(
      { error: "Failed to fetch retro data" },
      { status: 500 }
    );
  }
}
