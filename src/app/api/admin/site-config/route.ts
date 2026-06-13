// ============================================================
// Trading Tazos Game — Admin Site Config API
// Read/write site configuration key-value pairs
// Protected: admin-only (dev email check)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Built-in config keys with defaults
const CONFIG_DEFAULTS: Record<string, any> = {
  maintenance_mode: false,
  welcome_credits: 100,
  daily_quest_reward: 50,
  pvp_enabled: true,
  max_tazos_per_collection: 50,
  shop_enabled: true,
  trading_enabled: true,
  registrations_open: true,
};

// GET — fetch all config or a single key
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const config = await prisma.siteConfig.findUnique({ where: { key } });
      const defaultValue = CONFIG_DEFAULTS[key as keyof typeof CONFIG_DEFAULTS];
      return NextResponse.json({
        key,
        value: config ? JSON.parse(config.value) : (defaultValue !== undefined ? defaultValue : null),
        updatedAt: config?.updatedAt || null,
        updatedBy: config?.updatedBy || null,
      });
    }

    // Return all config keys with defaults merged
    const dbConfigs = await prisma.siteConfig.findMany();
    const configMap: Record<string, any> = {};
    
    // Start with defaults
    for (const [k, v] of Object.entries(CONFIG_DEFAULTS)) {
      configMap[k] = { key: k, value: v, isDefault: true };
    }
    
    // Override with DB values
    for (const cfg of dbConfigs) {
      configMap[cfg.key] = {
        key: cfg.key,
        value: JSON.parse(cfg.value),
        updatedAt: cfg.updatedAt,
        updatedBy: cfg.updatedBy,
        isDefault: false,
      };
    }

    return NextResponse.json({ configs: Object.values(configMap) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST — save a config key
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== "dev@tradingtazosgame.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const config = await prisma.siteConfig.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        updatedBy: user.email,
      },
      create: {
        key,
        value: JSON.stringify(value),
        updatedBy: user.email,
      },
    });

    return NextResponse.json({ success: true, key: config.key, value: JSON.parse(config.value) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Save failed" }, { status: 500 });
  }
}
