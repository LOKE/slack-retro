import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  getOrCreateActiveRetro,
  createActionItem,
  markActionItemComplete,
  markActionItemIncomplete,
} from "@/lib/queries";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(request.cookies);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, responsibleUserId, responsibleUserName } = body;

    if (!content || !responsibleUserId || !responsibleUserName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get active retro
    const retro = await getOrCreateActiveRetro(session.teamId);

    // Create action item
    const item = await createActionItem(
      retro.id,
      session.userId,
      responsibleUserId,
      responsibleUserName,
      content
    );

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating action item:", error);
    return NextResponse.json(
      { error: "Failed to create action item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(request.cookies);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, completed } = body;

    if (!itemId || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Toggle completion status
    if (completed) {
      await markActionItemComplete(itemId);
    } else {
      await markActionItemIncomplete(itemId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}
