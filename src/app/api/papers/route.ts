import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Paper } from "@/lib/models/Paper";

export async function GET() {
  try {
    await connectToDatabase();
    const papers = await Paper.find().sort({ createdAt: -1 });
    return NextResponse.json({ papers });
  } catch (error: unknown) {
    console.error("Fetch papers error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
