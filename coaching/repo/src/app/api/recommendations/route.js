import { NextResponse } from 'next/server';

// PRD-04 REQ-REC-008: Recommendation endpoints
export async function GET() {
  return NextResponse.json({ recommendations: [] });
}

export async function POST() {
  // POST /api/recommendations/generate
  return NextResponse.json({ status: 'generation_triggered', timestamp: new Date().toISOString() });
}
