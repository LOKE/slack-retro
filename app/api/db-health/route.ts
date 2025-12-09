import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const results: { [key: string]: any } = {};

    // Test retrospectives table
    try {
      const retrospectives = await sql`SELECT COUNT(*) as count FROM retrospectives`;
      results.retrospectives = { exists: true, count: retrospectives[0].count };
    } catch (error) {
      results.retrospectives = { exists: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Test discussion_items table
    try {
      const discussionItems = await sql`SELECT COUNT(*) as count FROM discussion_items`;
      results.discussion_items = { exists: true, count: discussionItems[0].count };
    } catch (error) {
      results.discussion_items = { exists: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Test action_items table
    try {
      const actionItems = await sql`SELECT COUNT(*) as count FROM action_items`;
      results.action_items = { exists: true, count: actionItems[0].count };
    } catch (error) {
      results.action_items = { exists: false, error: error instanceof Error ? error.message : String(error) };
    }

    const allExist = Object.values(results).every(r => r.exists);

    return NextResponse.json({
      success: allExist,
      tables: results,
      message: allExist
        ? "All tables exist"
        : "Some tables are missing - run POST /api/init-db to initialize",
    });
  } catch (error) {
    console.error("Error checking database health:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check database",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
