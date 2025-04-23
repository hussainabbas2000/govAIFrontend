'use client';

import {useState, useEffect} from 'react';
import septaListings from '@/data/septa_open_quotes.json';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';

export default function SeptaOpportunitiesPage() {
  const [septaOpportunities, setSeptaOpportunities] = useState(septaListings);

  return (
    <main className="flex-1 p-4">
      <h2 className="text-3xl font-bold mb-4">SEPTA Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {septaOpportunities.map((opportunity, index) => (
          <OpportunityCard key={index} opportunity={opportunity} />
        ))}
      </div>
    </main>
  );
}

interface Opportunity {
  Title: string;
  'Bid Number': string;
  Link: string;
}

const OpportunityCard: React.FC<{opportunity: Opportunity}> = ({
  opportunity,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-primary font-semibold">
          {opportunity.Title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link href={`/septa/${encodeURIComponent(opportunity.Link)}`} rel="noopener noreferrer">
          <Button className="bg-accent hover:bg-accent-hover text-accent-foreground transition-colors duration-200">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
