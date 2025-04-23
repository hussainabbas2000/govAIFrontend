'use client';

import {useEffect, useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

interface SamGovOpportunity {
  id: string;
  title: string;
  agency: string;
  location: string;
  closingDate: string;
  NAICS: string
}

const itemsPerPage = 10;


export default function SamGovOpportunitiesPage() {
  const [samGovOpportunities, setSamGovOpportunities] = useState<
    SamGovOpportunity[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate fetching SAM.gov opportunities
    const dummyData: SamGovOpportunity[] = [
      {
        id: '1',
        title: 'Software Development Services',
        agency: 'Department of Defense',
        location: 'Washington, DC',
        closingDate: '2024-06-30',
        NAICS: "45210"

        
      },
      {
        id: '2',
        title: 'Construction of New Federal Building',
        agency: 'General Services Administration',
        location: 'San Francisco, CA',
        closingDate: '2024-07-15',
        NAICS: "45211"

      },
      {
        id: '3',
        title: 'Supply of Office Equipment',
        agency: 'Department of Interior',
        location: 'Denver, CO',
        closingDate: '2024-08-01',
        NAICS: "45212"
      },
      {
        id: '4',
        title: 'SAM.gov Opportunity 4',
        agency: 'Department of Defense',
        location: 'Arlington, VA',
        closingDate: '2024-09-20',
        NAICS: "45213"

      },
      {
        id: '5',
        title: 'SAM.gov Opportunity 5',
        agency: 'Department of Energy',
        location: 'Germantown, MD',
        closingDate: '2024-10-05',
        NAICS: "45214"

      },
      {
        id: '6',
        title: 'SAM.gov Opportunity 6',
        agency: 'Department of Transportation',
        location: 'Washington, DC',
        closingDate: '2024-11-12',
        NAICS: "45215"
      },
      {
        id: '7',
        title: 'SAM.gov Opportunity 7',
        agency: 'Department of Education',
        location: 'Washington, DC',
        closingDate: '2024-12-01',
        NAICS: "45216"

      },
      {
        id: '8',
        title: 'SAM.gov Opportunity 8',
        agency: 'Department of Commerce',
        location: 'Washington, DC',
        closingDate: '2025-01-15',
        NAICS: "45217"

      },
      {
        id: '9',
        title: 'SAM.gov Opportunity 9',
        agency: 'Department of Treasury',
        location: 'Washington, DC',
        closingDate: '2025-02-28',
        NAICS: "45218"

      },
      {
        id: '10',
        title: 'SAM.gov Opportunity 10',
        agency: 'Department of Justice',
        location: 'Washington, DC',
        closingDate: '2025-03-10',
        NAICS: "45219"

      },
      {
        id: '11',
        title: 'SAM.gov Opportunity 11',
        agency: 'Department of Homeland Security',
        location: 'Washington, DC',
        closingDate: '2025-04-01',
        NAICS: "45220"

      },
      {
        id: '12',
        title: 'SAM.gov Opportunity 12',
        agency: 'Environmental Protection Agency',
        location: 'Washington, DC',
        closingDate: '2025-05-01',
        NAICS: "45221"

      },
    ];
    setSamGovOpportunities(dummyData);
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to the first page when the search query changes
  };

  const filteredOpportunities = samGovOpportunities?.filter(opportunity => {
    return (
      opportunity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opportunity.agency?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalItems = filteredOpportunities?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentOpportunities = filteredOpportunities?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <main className="flex flex-col gap-4 p-4">
      <div className="container mx-auto max-w-screen-lg">
        <div className="my-4 flex items-center justify-between">
          <h2 className="text-3xl font-bold">SAM.gov Opportunities</h2>
            {samGovOpportunities && samGovOpportunities.length > 0 && (
                <div className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 font-medium text-sm">
                  Total Listings: {samGovOpportunities.length}
                </div>
            )}
          <div className="flex items-center space-x-2">
            <Label htmlFor="search">Search:</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {currentOpportunities.map(opportunity => (
            <Card key={opportunity.id} className="bg-card text-card-foreground shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{opportunity.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Agency: {opportunity.agency}</CardDescription>
                <CardDescription>Location: {opportunity.location}</CardDescription>
                <CardDescription>Closing Date: {opportunity.closingDate}</CardDescription>
                <CardDescription>NAICS: {opportunity.NAICS}</CardDescription>
                <Button>View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex w-full items-center justify-center space-x-2 p-4">
          <Button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span>{`Page ${currentPage} of ${totalPages}`}</span>
          <Button
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
       </div>
     </main>
   );
 }
