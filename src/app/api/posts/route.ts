import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const PostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(10000).optional(),
  budget: z.string().trim().max(120).optional(),
  deadline: z.string().trim().max(120).optional(),
});

async function getUserIdFromAuthHeader(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return data.user.id;
}

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("posts")
    .select("id, title, content, budget, deadline, status, created_at, author_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const userId = await getUserIdFromAuthHeader(authHeader);
  if (!userId) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, verification_status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  if (!profile.verification_status) {
    return NextResponse.json({ message: "Verification required" }, { status: 403 });
  }

  const { data: post, error: postError } = await admin
    .from("posts")
    .insert({
      author_id: userId,
      title: parsed.data.title,
      content: parsed.data.content?.trim() || null,
      budget: parsed.data.budget?.trim() || null,
      deadline: parsed.data.deadline?.trim() || null,
      status: "open",
    })
    .select("id")
    .single();

  if (postError || !post) {
    return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
  }

  return NextResponse.json({ id: post.id });
}