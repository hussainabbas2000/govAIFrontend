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

// Define a type for the TotalListingsLabel component props
interface TotalListingsLabelProps {
  total: number | null; // Allow null for initial loading state
  loading?: boolean;
  className?: string;
}

// TotalListingsLabel component implementation (or ensure it's correctly imported)
function TotalListingsLabel({ total, loading, className }: TotalListingsLabelProps) {
  if (loading || total === null) {
    // Use a simple text placeholder or a Skeleton component if available
    return <span className={cn('text-sm text-muted-foreground', className)}>Loading...</span>;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm border border-primary/20',
        className
      )}
    >
      Total Listings: {total}
    </div>
  );
}


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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSamGovOpportunities = async () => {
      setLoading(true);
      const opportunities = await getSamGovOpportunities({}); // Fetch all initially

      if(opportunities){
        setSamGovOpportunities(opportunities);
        setTotalItems(opportunities.length);
      }
      setLoading(false);
    };

    fetchSamGovOpportunities();
  }, []); // Fetch only once on component mount

  // Filter opportunities based on current state
  const filteredOpportunities = samGovOpportunities?.filter(opportunity => {
    // Search query filter (check title, department, subtier, office)
    const matchesSearch =
      opportunity.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.subtier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.office?.toLowerCase().includes(searchQuery.toLowerCase());

    // NAICS code filter
    const matchesNaics =
      !ncodeFilter || // If no filter, always true
      opportunity.ncode?.toLowerCase().includes(ncodeFilter.toLowerCase());

    // Location filter (check city, state, country, zip)
    const matchesLocation =
      !locationFilter || // If no filter, always true
      [
        opportunity.location?.city?.name,
        opportunity.location?.state?.name,
        opportunity.location?.country?.name,
        opportunity.location?.zip,
      ]
        .filter(Boolean) // removes undefined/null entries
        .some((field) => field && field.toLowerCase().includes(locationFilter.toLowerCase()));

    // Date filter
    const matchesDate =
      !dateFilter || // If no filter, always true
      (opportunity.closingDate && new Date(opportunity.closingDate) >= dateFilter); // Check if closing date is on or after selected date

    // Open listings filter
    const isOpen =
      opportunity.closingDate && new Date(opportunity.closingDate) >= new Date(); // Check if closing date is today or later
    const matchesOpen = !showOnlyOpen || isOpen; // Apply filter only if checkbox is checked

    return matchesSearch && matchesNaics && matchesLocation && matchesDate && matchesOpen;
  });

  const currentTotalItems = filteredOpportunities?.length || 0;
  const totalPages = Math.ceil(currentTotalItems / itemsPerPage);

  // Paginate the *filtered* opportunities
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset page on filter change
  };

  const handleNcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNcodeFilter(event.target.value);
    setCurrentPage(1); // Reset page on filter change
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(event.target.value);
    setCurrentPage(1); // Reset page on filter change
  };

  const handleClearDate = () => {
    setDateFilter(undefined);
    setCurrentPage(1); // Reset page on filter change
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDateFilter(date);
    setCurrentPage(1); // Reset page on filter change
  }

  const handleShowOnlyOpenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyOpen(event.target.checked);
    setCurrentPage(1); // Reset page on filter change
  }


  return (
    <main className="flex flex-1">
      {/* Sidebar for Filters */}
      <aside className="w-64 border-r p-4 flex flex-col space-y-4 bg-secondary/50">
        <h3 className="text-lg font-semibold mb-2">Filters</h3>

        {/* Search Filter */}
        <div>
          <Label htmlFor="search">Search:</Label>
          <Input
            id="search"
            type="text"
            placeholder="Keywords..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* NAICS Code Filter */}
        <div>
          <Label htmlFor="naics">NAICS Code:</Label>
          <Input
            id="naics"
            type="text"
            placeholder="e.g., 541511"
            value={ncodeFilter}
            onChange={handleNcodeChange}
          />
        </div>

        {/* Location Filter */}
        <div>
          <Label htmlFor="location">Execute Location:</Label>
          <Input
            id="location"
            type="text"
            placeholder="City, State, Zip..."
            value={locationFilter}
            onChange={handleLocationChange}
          />
        </div>

        {/* Date Filter */}
        <div>
          <Label>Closing Date:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateFilter && 'text-muted-foreground'
                )}
              >
                 <Icons.calendar className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDate}
              className="mt-1 w-full text-xs"
            >
              Clear Date
            </Button>
          )}
        </div>

         {/* Show Only Open Listings Filter
         <div className="flex items-center space-x-2 pt-2">
            <Input
              type="checkbox"
              id="open-listings"
              checked={showOnlyOpen}
              onChange={handleShowOnlyOpenChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="open-listings" className="text-sm font-medium text-gray-700">
              Show Only Open Listings
            </Label>
          </div> */}
      </aside>

      {/* Main Content Area for Listings */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">SAM.gov Opportunities</h2>
           <TotalListingsLabel total={currentTotalItems} loading={loading} />
        </div>

        {loading ? (
           <p>Loading opportunities...</p> // Or use Skeleton components
        ) : currentOpportunities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {currentOpportunities.map(opportunity => (
              <Card key={opportunity.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold line-clamp-2">{opportunity.title}</CardTitle>
                   <CardDescription className="text-sm text-muted-foreground pt-1">NAICS: {opportunity.ncode || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                   <CardDescription>Department: {opportunity.department || 'N/A'}</CardDescription>
                   <CardDescription>Subtier: {opportunity.subtier || 'N/A'}</CardDescription>
                   <CardDescription>Office: {opportunity.office || 'N/A'}</CardDescription>
                   <CardDescription>Type: {opportunity.type || 'N/A'}</CardDescription>
                   <CardDescription>Office Address: {opportunity.officeAddress || 'N/A'}</CardDescription>
                   <CardDescription>
                      Execute Location: {opportunity.location ? `${opportunity.location.city?.name || ''}${opportunity.location.city?.name && opportunity.location.state?.name ? ', ' : ''}${opportunity.location.state?.name || ''} ${opportunity.location.zip || ''}`.trim() || 'N/A' : 'N/A'}
                   </CardDescription>
                   <CardDescription>Closing Date: {opportunity.closingDate || 'N/A'}</CardDescription>
                   <Button asChild size="sm" className="mt-2">
                     <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                       View Details
                     </a>
                   </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-10">No opportunities match the current filters.</p>
        )}

        {/* Pagination Controls */}
        { totalPages > 1 && (
            <div className="flex w-full items-center justify-center space-x-2 p-4 mt-6">
              <Button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {`Page ${currentPage} of ${totalPages}`}
              </span>
              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
        )}
      </div>
    </main>
  );
}
