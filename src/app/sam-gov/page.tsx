'use client';

import {useEffect, useState} from 'react';
import {getSamGovOpportunities, SamGovOpportunity} from '@/services/sam-gov';

export default function SamGovOpportunitiesPage() {
  const [samGovOpportunities, setSamGovOpportunities] = useState<
    SamGovOpportunity[]
  >([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      const samGovData = await getSamGovOpportunities({});
      setSamGovOpportunities(samGovData);
    };

    fetchOpportunities();
  }, []);

  return (
    <main className="flex-1 p-4">
      <h2>SAM.gov Opportunities</h2>
      <ul>
        {samGovOpportunities.map(opportunity => (
          <li key={opportunity.id}>
            {opportunity.title} - {opportunity.agency} ({opportunity.location})
          </li>
        ))}
      </ul>
    </main>
  );
}
