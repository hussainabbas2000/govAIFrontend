import {classifySeptaListing, ClassifySeptaListingInput} from '@/ai/flows/classify-septa-listing';
import {NextResponse} from 'next/server';

export async function POST(req: Request) {
  try {
    const {listingDescription}: ClassifySeptaListingInput = await req.json();

    if (!listingDescription) {
      return NextResponse.json({
        error: 'Missing listing description',
      }, {
        status: 400,
      });
    }

    const classification = await classifySeptaListing({listingDescription});
    return NextResponse.json(classification);
  } catch (error: any) {
    console.error('Error classifying SEPTA listing:', error);
    return NextResponse.json({error: error.message || 'Failed to classify SEPTA listing'}, {status: 500});
  }
}
