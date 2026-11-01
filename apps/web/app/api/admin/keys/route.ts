import { NextRequest, NextResponse } from "next/server";
import { getKeyPool } from "@/lib/llm/keypool";
import { getRedisClient } from "@/lib/redis/client";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true; // Open in local development if no secret configured

  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-admin-key");

  if (authHeader === `Bearer ${secret}` || customHeader === secret) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getKeyPool();
  const statuses = await pool.getStatus();

  return NextResponse.json({
    totalKeys: pool.getKeyCount(),
    keys: statuses,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, keyIndex } = body;

    const pool = getKeyPool();
    const redis = getRedisClient();

    if (action === "reset-cooldown" && typeof keyIndex === "number") {
      await redis.del(`kp:cool:${keyIndex}`);
      return NextResponse.json({ success: true, message: `Cooldown reset for key k${keyIndex}` });
    }

    if (action === "revive-dead" && typeof keyIndex === "number") {
      await redis.del(`kp:dead:${keyIndex}`);
      return NextResponse.json({ success: true, message: `Revived key k${keyIndex}` });
    }

    if (action === "reset-all") {
      for (let i = 1; i <= 10; i++) {
        await redis.del(`kp:cool:${i}`);
        await redis.del(`kp:dead:${i}`);
      }
      return NextResponse.json({ success: true, message: "Reset all key cooldowns and dead states" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
