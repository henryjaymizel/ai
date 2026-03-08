import { NextResponse } from 'next/server';

// PRD-02 REQ-CALL-009: API Contract
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    calls: [],
    filters: {
      rep: searchParams.get('rep'),
      date: searchParams.get('date'),
      deal: searchParams.get('deal'),
    },
    message: 'Connect to gong-sync module for production data',
  });
}
