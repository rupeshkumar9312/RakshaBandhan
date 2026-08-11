import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Polled by the admin shell every ~12s to surface newly-placed orders. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceParam = new URL(request.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(0);

  const orders = await prisma.order.findMany({
    where: { placedAt: { gt: since } },
    orderBy: { placedAt: "desc" },
    take: 20,
    select: { id: true, orderNumber: true, contactName: true, total: true, placedAt: true },
  });

  return NextResponse.json({ orders, serverTime: new Date().toISOString() });
}
