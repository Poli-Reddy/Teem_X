import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, `${id}.json`);
    await fs.unlink(filePath);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete analysis', details: e?.toString() }, { status: 500 });
  }
}