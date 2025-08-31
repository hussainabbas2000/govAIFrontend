import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://127.0.0.1:9000';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const response = await fetch(`${PYTHON_SERVER_URL}/api/negotiate/${params.sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch negotiation status');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching negotiation status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch negotiation status' },
      { status: 500 }
    );
  }
}