import { NextResponse } from 'next/server';

// PRD-02 REQ-CALL-009: Prompt API
export async function GET() {
  return NextResponse.json({
    version: 1,
    template: 'Default prompt template — see /settings/prompt page',
    updated_at: new Date().toISOString(),
  });
}

export async function PUT(request) {
  const body = await request.json();
  return NextResponse.json({
    version: (body.version || 1) + 1,
    template: body.template,
    updated_at: new Date().toISOString(),
  });
}
