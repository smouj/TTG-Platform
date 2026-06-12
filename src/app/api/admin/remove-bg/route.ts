import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { getAuthUser } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com";
const execAsync = promisify(exec);

const CREATURES_DIR = path.join(process.cwd(), "scripts", "tazo-creatures");
const PUBLIC_CREATURES_DIR = path.join(process.cwd(), "public", "tazo-creatures");

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function downloadImage(url: string): Promise<Buffer> {
  // Handle relative URLs (strip leading slash for file path)
  if (url.startsWith("/")) {
    // Check public dir first
    const pubPath = path.join(process.cwd(), "public", url.slice(1));
    if (fs.existsSync(pubPath)) return fs.readFileSync(pubPath);
    // Check tazos-generated
    const genPath = path.join(process.cwd(), "public", "tazos-generated", url.split("/").pop() || "");
    if (fs.existsSync(genPath)) return fs.readFileSync(genPath);
    throw new Error(`Local file not found: ${pubPath}`);
  }

  // Absolute URL
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function removeBackground(inputBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `rembg-input-${Date.now()}.png`);
  const outputPath = path.join(tmpDir, `rembg-output-${Date.now()}.png`);
  const scriptPath = path.join(tmpDir, `rembg-run-${Date.now()}.py`);

  try {
    fs.writeFileSync(inputPath, inputBuffer);

    // Use Python script (more reliable than CLI for PATH issues)
    const script = `
import sys
from rembg import remove, new_session
from PIL import Image

img = Image.open("${inputPath}")
session = new_session("u2net")
output = remove(img, session=session)
output.save("${outputPath}", "PNG")
print("OK")
`;
    fs.writeFileSync(scriptPath, script);

    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}"`,
      { timeout: 120000 }
    );

    if (!fs.existsSync(outputPath) || !stdout.includes("OK")) {
      const errMsg = stderr || stdout || "rembg output not produced";
      throw new Error(`rembg failed: ${errMsg}`);
    }

    const result = fs.readFileSync(outputPath);
    return result;
  } finally {
    try { fs.unlinkSync(inputPath); } catch {}
    try { fs.unlinkSync(outputPath); } catch {}
    try { fs.unlinkSync(scriptPath); } catch {}
  }
}

// POST /api/admin/remove-bg
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    let franchise = "";
    let slug = "";
    let imageBuffer: Buffer;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // File upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      franchise = (formData.get("franchise") as string) || "unknown";
      slug = (formData.get("slug") as string) || `upload-${Date.now()}`;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON with imageUrl
      const body = await req.json();
      const imageUrl: string = body.imageUrl;
      franchise = body.franchise || "unknown";
      slug = body.slug || "unknown";

      if (!imageUrl) {
        return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
      }

      imageBuffer = await downloadImage(imageUrl);
    }

    // Run rembg
    const processedBuffer = await removeBackground(imageBuffer);

    // Normalize slug (lowercase, no spaces)
    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const safeFranchise = franchise.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Save to scripts/tazo-creatures/{franchise}/{slug}.png
    const creatureDir = path.join(CREATURES_DIR, safeFranchise);
    ensureDir(creatureDir);
    const creaturePath = path.join(creatureDir, `${safeSlug}.png`);
    fs.writeFileSync(creaturePath, processedBuffer);

    // Also save to public/tazo-creatures/{franchise}/{slug}.png for web serving
    const publicDir = path.join(PUBLIC_CREATURES_DIR, safeFranchise);
    ensureDir(publicDir);
    const publicPath = path.join(publicDir, `${safeSlug}.png`);
    fs.writeFileSync(publicPath, processedBuffer);

    const resultUrl = `/tazo-creatures/${safeFranchise}/${safeSlug}.png`;

    return NextResponse.json({
      success: true,
      resultUrl,
      path: creaturePath,
      sizeBytes: processedBuffer.length,
    });
  } catch (error: any) {
    console.error("remove-bg error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
