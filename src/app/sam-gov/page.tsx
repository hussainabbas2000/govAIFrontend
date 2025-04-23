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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';

interface SamGovOpportunity {
  id: string;
  title: string;
  agency: string;
  location: string;
  closingDate: string;
  NAICS: string;
}

const itemsPerPage = 10;

export default function SamGovOpportunitiesPage() {
  const [samGovOpportunities, setSamGovOpportunities] = useState<
    SamGovOpportunity[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [naicsFilter, setNaicsFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Simulate fetching SAM.gov opportunities
    const dummyData: SamGovOpportunity[] = [
      {
        id: '1',
        title: 'Software Development Services',
        agency: 'Department of Defense',
        location: 'Washington, DC',
        closingDate: '2024-06-30',
        NAICS: '541511',
      },
      {
        id: '2',
        title: 'Construction of New Federal Building',
        agency: 'General Services Administration',
        location: 'San Francisco, CA',
        closingDate: '2024-07-15',
        NAICS: '236220',
      },
      {
        id: '3',
        title: 'Supply of Office Equipment',
        agency: 'Department of Interior',
        location: 'Denver, CO',
        closingDate: '2024-08-01',
        NAICS: '453210',
      },
      {
        id: '4',
        title: 'SAM.gov Opportunity 4',
        agency: 'Department of Defense',
        location: 'Arlington, VA',
        closingDate: '2024-09-20',
        NAICS: '541512',
      },
      {
        id: '5',
        title: 'SAM.gov Opportunity 5',
        agency: 'Department of Energy',
        location: 'Germantown, MD',
        closingDate: '2024-10-05',
        NAICS: '541715',
      },
      {
        id: '6',
        title: 'SAM.gov Opportunity 6',
        agency: 'Department of Transportation',
        location: 'Washington, DC',
        closingDate: '2024-11-12',
        NAICS: '488119',
      },
      {
        id: '7',
        title: 'SAM.gov Opportunity 7',
        agency: 'Department of Education',
        location: 'Washington, DC',
        closingDate: '2024-12-01',
        NAICS: '611710',
      },
      {
        id: '8',
        title: 'SAM.gov Opportunity 8',
        agency: 'Department of Commerce',
        location: 'Washington, DC',
        closingDate: '2025-01-15',
        NAICS: '541611',
      },
      {
        id: '9',
        title: 'SAM.gov Opportunity 9',
        agency: 'Department of Treasury',
        location: 'Washington, DC',
        closingDate: '2025-02-28',
        NAICS: '524210',
      },
      {
        id: '10',
        title: 'SAM.gov Opportunity 10',
        agency: 'Department of Justice',
        location: 'Washington, DC',
        closingDate: '2025-03-10',
        NAICS: '922120',
      },
      {
        id: '11',
        title: 'SAM.gov Opportunity 11',
        agency: 'Department of Homeland Security',
        location: 'Washington, DC',
        closingDate: '2025-04-01',
        NAICS: '561612',
      },
      {
        id: '12',
        title: 'SAM.gov Opportunity 12',
        agency: 'Environmental Protection Agency',
        location: 'Washington, DC',
        closingDate: '2025-05-01',
        NAICS: '541620',
      },
    ];
    setSamGovOpportunities(dummyData);
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to the first page when the search query changes
  };

  const filteredOpportunities = samGovOpportunities?.filter(opportunity => {
    const matchesSearch =
      opportunity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.agency?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesNaics =
      naicsFilter === '' ||
      opportunity.NAICS?.toLowerCase().includes(naicsFilter.toLowerCase());

    const matchesLocation =
      locationFilter === '' ||
      opportunity.location?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesDate =
      !dateFilter ||
      format(dateFilter, 'yyyy-MM-dd') === opportunity.closingDate;

    return matchesSearch && matchesNaics && matchesLocation && matchesDate;
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

  const handleNaicsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNaicsFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(event.target.value);
    setCurrentPage(1);
  };

  return (
    <main className="flex flex-col gap-4 p-4">
      <div className="container mx-auto max-w-screen-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">SAM.gov Opportunities</h2>
          <div className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 font-medium text-sm">
            Total Listings: {samGovOpportunities.length}
          </div>
        </div>

        <div className="flex mb-4">
          <div className="w-1/4 pr-4">
            <h3 className="text-lg font-semibold mb-2">Filters</h3>
            <div className="mb-2">
              <Label htmlFor="search">Search:</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="mb-2">
              <Label htmlFor="naics">NAICS Code:</Label>
              <Input
                id="naics"
                type="text"
                placeholder="Filter by NAICS code..."
                value={naicsFilter}
                onChange={handleNaicsChange}
              />
            </div>

            <div className="mb-2">
              <Label htmlFor="location">Location:</Label>
              <Input
                id="location"
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={handleLocationChange}
              />
            </div>
            <div className="mb-2">
              <Label>Closing Date:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[240px] justify-start text-left font-normal',
                      !dateFilter && 'text-muted-foreground'
                    )}
                  >
                    {dateFilter ? (
                      format(dateFilter, 'yyyy-MM-dd')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    disabled={(date) => date < new Date('2020-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="w-3/4">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {currentOpportunities.map(opportunity => (
                <Card key={opportunity.id} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {opportunity.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Agency: {opportunity.agency}</CardDescription>
                    <CardDescription>Location: {opportunity.location}</CardDescription>
                    <CardDescription>
                      Closing Date: {opportunity.closingDate}
                    </CardDescription>
                    <CardDescription>NAICS: {opportunity.NAICS}</CardDescription>
                    <Button>View Details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
          <span>
            {`Page ${currentPage} of ${totalPages} (Total: ${totalItems} items)`}
          </span>
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
