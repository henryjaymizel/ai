import { NextResponse } from 'next/server';

// PRD-02 REQ-CALL-009: Gong sync trigger
export async function POST() {
  return NextResponse.json({
    status: 'gong_sync_triggered',
    timestamp: new Date().toISOString(),
  });
}
