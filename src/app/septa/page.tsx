'use client';

import {useEffect, useState} from 'react';
import {getSeptaOpportunities, SeptaOpportunity} from '@/services/septa';

export default function SeptaOpportunitiesPage() {
  const [septaOpportunities, setSeptaOpportunities] = useState<
    SeptaOpportunity[]
  >([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      const septaData = await getSeptaOpportunities({});
      setSeptaOpportunities(septaData);
    };

    fetchOpportunities();
  }, []);

  return (
    <main className="flex-1 p-4">
      <h2>SEPTA Opportunities</h2>
      <ul>
        {septaOpportunities.map(opportunity => (
          <li key={opportunity.id}>
            {opportunity.title} - {opportunity.department} ({opportunity.location})
          </li>
        ))}
      </ul>
    </main>
  );
}
