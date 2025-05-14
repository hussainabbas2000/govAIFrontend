
import { NextResponse } from 'next/server';
import { getSamGovOpportunities } from '@/services/sam-gov';
import type { SamGovOpportunity } from '@/types/sam-gov'; // Updated import

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchParamsObject: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    searchParamsObject[key] = value;
  });

  try {
    const opportunities: SamGovOpportunity[] = await getSamGovOpportunities(searchParamsObject);
    return NextResponse.json(opportunities);
  } catch (error: any) {
    console.error("Error in SAM.gov API route:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch SAM.gov opportunities' }, { status: 500 });
  }
}
