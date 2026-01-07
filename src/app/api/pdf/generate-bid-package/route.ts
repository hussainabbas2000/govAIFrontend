import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/pdf/generate-bid-package`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to get error message
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || 'Failed to generate PDF' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: 'Failed to generate PDF' },
          { status: response.status }
        );
      }
    }

    // Check if response is PDF or JSON (fallback HTML)
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/pdf')) {
      // Return PDF as blob
      const pdfBlob = await response.blob();
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', response.headers.get('Content-Disposition') || 'attachment; filename=bid_package.pdf');
      
      return new NextResponse(pdfBlob, { headers });
    } else {
      // Return JSON (HTML fallback)
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

