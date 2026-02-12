import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Paper } from "@/lib/models/Paper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    await connectToDatabase();
    const paper = await Paper.create(body);

    return NextResponse.json({ success: true, paper });
  } catch (error: unknown) {
    console.error("Create paper error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
