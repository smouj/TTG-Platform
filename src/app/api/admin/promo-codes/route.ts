// ============================================================
// Trading Tazos Game — Admin Promo Codes API
// CRUD for promotion codes (credits, bags, designs, premium)
// Protected: admin-only (dev email check)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — list all promo codes
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const codes = await prisma.promotionCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ codes });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST — create a new promo code
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, description, type, value, maxUses, minLevel, expiresAt } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const existing = await prisma.promotionCode.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Code already exists" }, { status: 409 });
    }

    const promo = await prisma.promotionCode.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description || "",
        type: type || "credits",
        value: typeof value === "number" ? value : 0,
        maxUses: typeof maxUses === "number" ? maxUses : 100,
        minLevel: typeof minLevel === "number" ? minLevel : 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: user.email,
      },
    });

    return NextResponse.json({ success: true, code: promo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Creation failed" }, { status: 500 });
  }
}

// PUT — update an existing promo code
export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (fields.code !== undefined) updateData.code = fields.code.trim().toUpperCase();
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.type !== undefined) updateData.type = fields.type;
    if (fields.value !== undefined) updateData.value = fields.value;
    if (fields.maxUses !== undefined) updateData.maxUses = fields.maxUses;
    if (fields.minLevel !== undefined) updateData.minLevel = fields.minLevel;
    if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
    if (fields.expiresAt !== undefined) updateData.expiresAt = fields.expiresAt ? new Date(fields.expiresAt) : null;

    const promo = await prisma.promotionCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, code: promo });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

// DELETE — delete a promo code
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.promotionCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
