import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Deprecated endpoint" }, { status: 410 });
}