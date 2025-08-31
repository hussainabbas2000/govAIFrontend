import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://127.0.0.1:9000';


export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; supplierId: string } }
) {
  try {
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/negotiate/${params.sessionId}/accept/${params.supplierId}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error('Failed to accept quote');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting quote:', error);
    return NextResponse.json(
      { error: 'Failed to accept quote' },
      { status: 500 }
    );
  }
}