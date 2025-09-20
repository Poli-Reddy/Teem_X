import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const errors: string[] = [];
  try {
    const dataDir = path.join(process.cwd(), 'data');
    console.log('Clear-all API: resolved dataDir =', dataDir);
    const files = await fs.readdir(dataDir);
    for (const f of files) {
      if (f.endsWith('.json')) {
        try {
          await fs.unlink(path.join(dataDir, f));
        } catch (err) {
          console.error(`Failed to delete ${f}:`, err);
          errors.push(`Failed to delete ${f}: ${err?.toString()}`);
        }
      }
    }
    if (errors.length > 0) {
      console.error('Clear-all API: errors:', errors);
      return NextResponse.json({ error: 'Some files could not be deleted', details: errors }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Clear-all API: fatal error:', e);
    return NextResponse.json({ error: 'Failed to clear analyses', details: e?.toString() }, { status: 500 });
  }
}
