import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
  const { id, unhide } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, `${id}.json`);
  const buf = await fs.readFile(filePath, 'utf-8');
  const analysis = JSON.parse(buf);
  analysis.hidden = !!unhide ? false : true;
  await fs.writeFile(filePath, JSON.stringify(analysis, null, 2), 'utf-8');
  return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to hide analysis', details: e?.toString() }, { status: 500 });
  }
}