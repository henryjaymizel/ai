import { NextResponse } from 'next/server';

// PRD-02 REQ-CALL-009: Evaluation endpoints
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    evaluations: [],
    filters: {
      rep: searchParams.get('rep'),
      date: searchParams.get('date'),
      score_min: searchParams.get('score_min'),
      score_max: searchParams.get('score_max'),
    },
  });
}

export async function POST(request) {
  const body = await request.json();
  // POST /api/evaluations/re-evaluate
  return NextResponse.json({
    status: 're_evaluation_triggered',
    deal_ids: body.deal_ids || [],
  });
}
