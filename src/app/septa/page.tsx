'use client';

import {useState, useEffect} from 'react';
import septaListings from '@/data/septa_open_quotes.json';

export default function SeptaOpportunitiesPage() {
  const [septaOpportunities, setSeptaOpportunities] = useState(septaListings);

  useEffect(() => {
    console.log(septaOpportunities);
  }, [septaOpportunities]);

  return (
    <main className="flex-1 p-4">
      <h2>SEPTA Opportunities</h2>
      <ul>
        {septaOpportunities.map((opportunity, index) => (
          <li key={index}>
            {opportunity.Title} - {opportunity['Bid Number']}
          </li>
        ))}
      </ul>
    </main>
  );
}
