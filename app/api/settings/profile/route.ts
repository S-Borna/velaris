// Copyright (c) Said Borna. All rights reserved.
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { getUserProfile, updateUserProfile } from "@/lib/db/settings";

const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

/**
 * GET /api/settings/profile
 * Get the current user's profile.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const profile = await getUserProfile(ctx.userId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/settings/profile
 * Update the current user's profile.
 */
export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const ctx = await getAuthContext();
    const body: unknown = await request.json();
    const input = UpdateProfileSchema.parse(body);

    const profile = await updateUserProfile(ctx.userId, input);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
