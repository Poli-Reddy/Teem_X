import { NextRequest, NextResponse } from 'next/server';
import { generateSummaryReport } from '@/ai/flows/summary-report-generation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, overallSentiment, relationshipSummary } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }
    const result = await generateSummaryReport({ transcript, overallSentiment, relationshipSummary });
    return NextResponse.json({ summaryReport: result.summaryReport, relationshipSummary });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate summary report', details: error?.toString() }, { status: 500 });
  }
}