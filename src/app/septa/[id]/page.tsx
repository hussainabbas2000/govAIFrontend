'use client';

import {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Badge} from '@/components/ui/badge';

interface Opportunity {
  Title: string;
  'Bid Number': string;
  Link: string;
}

interface SeptaOpportunityPageProps {
  params: {id: string};
}

export default function SeptaOpportunityPage({params}: SeptaOpportunityPageProps) {
  const {id} = params;
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunity = async () => {
      setLoading(true);
      try {
        // Fetch the opportunity data
        const response = await fetch(params.id, {
          method: 'GET',
          headers: {'Content-Type': 'text/html'},
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const description = doc.querySelector('.field--name-body')?.textContent || 'No description available.';

        setOpportunity({
          Title: doc.title,
          'Bid Number': id,
          Link: params.id,
        });

        // Classify the opportunity using the AI
        const classifyResponse = await fetch('/api/classify-septa-listing', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({listingDescription: description}),
        });
        if (!classifyResponse.ok) {
          throw new Error(`AI Classification error! status: ${classifyResponse.status}`);
        }
        const classifyData = await classifyResponse.json();
        setTag(classifyData.tag);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setOpportunity(null);
        setTag(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [params.id]);

  return (
    <main className="flex-1 p-4">
      {loading ? (
        <p>Loading...</p>
      ) : opportunity ? (
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-primary font-semibold">
              {opportunity.Title}
            </CardTitle>
            {tag && (
              <Badge className="mt-2">{tag}</Badge>
            )}
          </CardHeader>
          <CardContent>
            <Link href={opportunity.Link} target="_blank" rel="noopener noreferrer">
              <Button className="bg-accent hover:bg-accent-hover text-accent-foreground transition-colors duration-200">
                View Details
              </Button>
            </Link>
            <Button
              onClick={() => router.back()}
              className="ml-2 bg-secondary hover:bg-secondary-hover text-secondary-foreground transition-colors duration-200"
            >
              Back to Listings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p>Opportunity not found.</p>
      )}
    </main>
  );
}
