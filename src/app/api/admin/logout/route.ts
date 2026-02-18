import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit-log";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  cookieStore.delete("admin_csrf");

  writeAuditLog(req, {
    category: "auth",
    action: "admin_logout",
    success: true,
    subject: "admin",
  });

  return NextResponse.json({ success: true });
}