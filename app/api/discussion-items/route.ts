import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  getOrCreateActiveRetro,
  createDiscussionItem,
  updateDiscussionItem,
  deleteDiscussionItem,
} from "@/lib/queries";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(request.cookies);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, content } = body;

    if (!category || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["good", "bad", "question"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Get active retro
    const retro = await getOrCreateActiveRetro(session.teamId);

    // Create discussion item
    const item = await createDiscussionItem(
      retro.id,
      session.userId,
      session.userName,
      category as "good" | "bad" | "question",
      content
    );

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion item:", error);
    return NextResponse.json(
      { error: "Failed to create discussion item" },
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
    const { itemId, content } = body;

    if (!itemId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update discussion item (query will verify ownership)
    await updateDiscussionItem(itemId, session.userId, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating discussion item:", error);
    return NextResponse.json(
      { error: "Failed to update discussion item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(request.cookies);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing itemId parameter" },
        { status: 400 }
      );
    }

    // Delete discussion item (query will verify ownership)
    await deleteDiscussionItem(itemId, session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discussion item:", error);
    return NextResponse.json(
      { error: "Failed to delete discussion item" },
      { status: 500 }
    );
  }
}
