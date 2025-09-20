import { NextRequest, NextResponse } from 'next/server';
import { generateRelationshipGraph } from '@/ai/flows/interactive-relationship-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }
    const result = await generateRelationshipGraph({ transcript });
    let graphData = {};
    try {
      graphData = JSON.parse(result.graphData);
    } catch {
      graphData = { nodes: [], links: [] };
    }
    return NextResponse.json({ graphData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate relationship graph', details: error?.toString() }, { status: 500 });
  }
}
