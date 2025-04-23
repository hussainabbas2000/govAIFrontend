'use client';

import {useEffect, useState} from 'react';

interface SamGovOpportunity {
  id: string;
  title: string;
  agency: string;
  location: string;
  closingDate: string;
}

export default function SamGovOpportunitiesPage() {
  const [samGovOpportunities, setSamGovOpportunities] = useState<
    SamGovOpportunity[]
  >([]);

  useEffect(() => {
    // Simulate fetching SAM.gov opportunities
    const dummyData: SamGovOpportunity[] = [
      {
        id: '1',
        title: 'Software Development Services',
        agency: 'Department of Defense',
        location: 'Washington, DC',
        closingDate: '2024-06-30',
      },
      {
        id: '2',
        title: 'Construction of New Federal Building',
        agency: 'General Services Administration',
        location: 'San Francisco, CA',
        closingDate: '2024-07-15',
      },
      {
        id: '3',
        title: 'Supply of Office Equipment',
        agency: 'Department of Interior',
        location: 'Denver, CO',
        closingDate: '2024-08-01',
      },
    ];
    setSamGovOpportunities(dummyData);
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

