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
import {Icons} from '@/components/icons';
import {SamGovOpportunity, getSamGovOpportunities} from '@/services/sam-gov';

const itemsPerPage = 10;

export default function SamGovOpportunitiesPage() {
  const [samGovOpportunities, setSamGovOpportunities] = useState<
    SamGovOpportunity[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [ncodeFilter, setNcodeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchSamGovOpportunities = async () => {
      const searchParams = {
        title: searchQuery,
        ncode: ncodeFilter,
        state: locationFilter,
      };

      const opportunities = await getSamGovOpportunities(searchParams);

      if(opportunities){
        setSamGovOpportunities(opportunities);
        setTotalItems(opportunities.length);
      }
    };

    fetchSamGovOpportunities();
  }, [searchQuery, ncodeFilter, locationFilter]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentOpportunities = samGovOpportunities?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleNcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNcodeFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleClearDate = () => {
    setDateFilter(undefined);
  };

  const handleFilter = () => {
      setCurrentPage(1);
  };

  const matchesDate = (opportunity: SamGovOpportunity) => {
    return !dateFilter || format(dateFilter, 'yyyy-MM-dd') === opportunity.closingDate;
  };

  const isCurrentlyOpen = (opportunity: SamGovOpportunity) => {
    return !dateFilter && new Date(opportunity.closingDate) >= new Date();
  };

  const showOpenListings = (opportunity: SamGovOpportunity) => {
    return !showOnlyOpen || new Date(opportunity.closingDate) >= new Date();
  };

  const filteredOpportunities = samGovOpportunities?.filter(opportunity => {
    const matchesSearch =
        opportunity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesNaics =
        ncodeFilter === '' ||
        opportunity.ncode?.toLowerCase().includes(ncodeFilter.toLowerCase());

    const matchesLocation =
        locationFilter === '' ||
        opportunity.location?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesNaics && matchesLocation && (matchesDate(opportunity) || (!dateFilter && showOnlyOpen && isCurrentlyOpen(opportunity)) || (!dateFilter && !showOnlyOpen)) && (showOpenListings(opportunity) || !showOnlyOpen);
  });

  return (
    <main className="flex flex-col gap-4 p-4">
      <div className="container mx-auto max-w-screen-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">SAM.gov Opportunities</h2>
          <div className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 font-medium text-sm">
            Total Listings: {totalItems}
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
                value={ncodeFilter}
                onChange={handleNcodeChange}
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

            <div className="mb-2 flex items-center">
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
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDate}
                  className="ml-2"
                >
                  <Icons.close className="w-4 h-4"/>
                </Button>
              )}
            </div>
             <div className="mb-2">
              <div className="flex items-center space-x-2">
                <Input
                  id="open"
                  type="checkbox"
                  checked={showOnlyOpen}
                  onChange={(e) => setShowOnlyOpen(e.target.checked)}
                  className="w-4 h-4"  // Adjust the size of the checkbox here
                />
                <Label htmlFor="open" className="text-sm">Show Only Open Listings</Label>
              </div>
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
                    <CardDescription>Department: {opportunity.department}</CardDescription>
                    <CardDescription>Subtier: {opportunity.subtier}</CardDescription>
                    <CardDescription>Office: {opportunity.office}</CardDescription>
                    <CardDescription>Type: {opportunity.type}</CardDescription>
                    <CardDescription>Office Address: {opportunity.officeAddress}</CardDescription>
                    <CardDescription>Location: {opportunity.location}</CardDescription>
                    <CardDescription>
                      Closing Date: {opportunity.closingDate}
                    </CardDescription>
                    <CardDescription>NAICS: {opportunity.ncode}</CardDescription>
                    <Button asChild>
                    <a href={`${opportunity.link}`} target="_blank" rel="noopener noreferrer">
                      View Details
                    </a>
                  </Button>
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
