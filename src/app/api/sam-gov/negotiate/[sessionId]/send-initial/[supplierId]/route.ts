import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://127.0.0.1:9000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; supplierId: string }> }
) {
  try {
    const { sessionId, supplierId } = await params;
    const body = await request.json();
    
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/negotiate/${sessionId}/send-initial/${supplierId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send initial message');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending initial message:', error);
    return NextResponse.json(
      { error: 'Failed to send initial message' },
      { status: 500 }
    );
  }
}