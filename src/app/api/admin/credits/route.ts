// ============================================================
// Trading Tazos Game — Admin Credits API
// Give/remove credits from users
// Protected: admin-only (dev email check)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — search users by email or name
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const userId = searchParams.get("userId");

    // If userId provided, return single user with credit history
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, displayName: true, credits: true,
          creditTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ user });
    }

    // Search users
    const users = await prisma.user.findMany({
      where: search ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
        ],
      } : {},
      select: { id: true, email: true, name: true, displayName: true, credits: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST — give credits to a user
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, amount, note } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    if (!amount || typeof amount !== "number" || amount === 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    // Use a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const newCredits = Math.max(0, user.credits + amount);
      await tx.user.update({ where: { id: userId }, data: { credits: newCredits } });
      
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          source: "admin",
          reference: note || "Manual admin adjustment",
        },
      });

      return { ...user, credits: newCredits, transaction };
    });

    return NextResponse.json({
      success: true,
      user: { id: result.id, email: result.email, name: result.name, credits: result.credits },
      transaction: result.transaction,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Credit adjustment failed" }, { status: 500 });
  }
}
