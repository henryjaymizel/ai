import { NextResponse } from 'next/server';

// PRD-04 REQ-REC-008: Trend endpoints
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    trends: [],
    filters: {
      period: searchParams.get('period'),
      scope: searchParams.get('scope'),
    },
  });
}
