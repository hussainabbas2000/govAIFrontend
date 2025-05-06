'use client';

import {useEffect, useState, useMemo} from 'react';
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
import {Checkbox} from '@/components/ui/checkbox';
import Loading from '@/app/loading';
import { Skeleton } from "@/components/ui/skeleton";
import { TotalListingsLabel } from '@/components/total-listings-label';
import Link from 'next/link';


const itemsPerPage = 10;

export default function SamGovOpportunitiesPage() {
  // State for the full list of opportunities (initially empty)
  const [allOpportunities, setAllOpportunities] = useState<SamGovOpportunity[]>([]);
  // State for descriptions (might be populated later or kept separate)
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [ncodeFilter, setNcodeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      setDescriptions({}); // Reset descriptions

      try {
        // Fetch opportunities list (using dummy data function for now)
        // Pass current filters to the dummy data function so it can filter
        const opportunities = await getSamGovOpportunities({
            searchQuery,
            ncode: ncodeFilter,
            location: locationFilter,
            dateFilter: dateFilter?.toISOString(), // Pass date as string if needed
            showOnlyOpen: showOnlyOpen ? 'true' : '', // Pass boolean as string
         });

        setAllOpportunities(opportunities);

        // Populate descriptions state from fetched data if descriptions are included
        const newDescriptions: Record<string, string> = {};
        opportunities.forEach(opp => {
          // If descriptions are fetched within getSamGovOpportunities (even dummy ones)
          newDescriptions[opp.id] = opp.description || "No description available.";
        });
        setDescriptions(newDescriptions); // You might adjust this if descriptions are fetched separately

      } catch (error: any) {
        console.error("Error fetching SAM.gov data:", error);
        setError(error.message || "Failed to load opportunities.");
        setAllOpportunities([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch data when component mounts or filters change
    fetchAllData();
  }, [searchQuery, ncodeFilter, locationFilter, dateFilter, showOnlyOpen]); // Re-fetch when filters change

  // NOTE: Filtering is now handled within getSamGovOpportunities for dummy data
  // If using real API with cache, filtering would happen here on the cached `allOpportunities`
  const filteredOpportunities = allOpportunities; // The data is already filtered

  const currentTotalItems = filteredOpportunities.length;
  const totalPages = Math.ceil(currentTotalItems / itemsPerPage);

  // Paginate the *already filtered* opportunities
  const currentOpportunities = useMemo(() => {
     return filteredOpportunities.slice(
       (currentPage - 1) * itemsPerPage,
       currentPage * itemsPerPage
     );
  }, [filteredOpportunities, currentPage]);


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

  const handleShowOnlyOpenChange = (checked: boolean | 'indeterminate') => {
    setShowOnlyOpen(!!checked); // Ensure boolean value
    setCurrentPage(1); // Reset page on filter change
  }

   // Function to truncate description
   const truncateDescription = (text: string | undefined, wordLimit: number): string => {
    if (!text) return 'N/A';
    // Handle cases where description might still be a URL if dummy data isn't fully populated
    if (text.startsWith('http')) return 'Description available via link.';
    const words = text.split(' ');
    if (words.length <= wordLimit) {
      return text;
    }
    return words.slice(0, wordLimit).join(' ') + '...';
  };


  if (loading && allOpportunities.length === 0) { // Show loading component only on initial load
    return <Loading />;
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
          <Label>Closing Date (On or After):</Label>
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
              variant="link"
              size="sm"
              onClick={handleClearDate}
              className="mt-1 w-full text-xs h-auto p-0 justify-start text-primary hover:underline"
            >
              Clear Date
            </Button>
          )}
        </div>

         <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="open-listings"
              checked={showOnlyOpen}
              onCheckedChange={handleShowOnlyOpenChange}
              className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
            />
            <Label htmlFor="open-listings" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Show Only Open Listings
            </Label>
          </div>
      </aside>

      {/* Main Content Area for Listings */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">SAM.gov Opportunities</h2>
           <TotalListingsLabel total={currentTotalItems} loading={loading && currentOpportunities.length === 0} />
        </div>

        {error && <div className="mb-4 text-red-600">Error: {error}</div>}

        {loading && currentOpportunities.length === 0 ? ( // Show skeletons only if loading AND no items shown yet
           <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
             {/* Show Skeletons */}
             {Array.from({ length: itemsPerPage }).map((_, index) => (
               <Card key={`skeleton-${index}`} className="shadow-md rounded-lg">
                 <CardHeader>
                   <Skeleton className="h-5 w-3/4 mb-2" />
                   <Skeleton className="h-4 w-1/2" />
                 </CardHeader>
                 <CardContent className="space-y-2">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-5/6" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-8 w-24 mt-2" />
                 </CardContent>
               </Card>
             ))}
           </div>
        ) : currentOpportunities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {currentOpportunities.map(opportunity => (
              <Card key={opportunity.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold line-clamp-2">{opportunity.title || 'N/A'}</CardTitle>
                   <CardDescription className="text-sm text-muted-foreground pt-1">NAICS: {opportunity.ncode || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 flex-grow">
                   <CardDescription>Department: {opportunity.department || 'N/A'}</CardDescription>
                   <CardDescription>Subtier: {opportunity.subtier || 'N/A'}</CardDescription>
                   <CardDescription>Office: {opportunity.office || 'N/A'}</CardDescription>
                   <CardDescription>Type: {opportunity.type || 'N/A'}</CardDescription>
                   <CardDescription>
                     Execute Location: {
                       opportunity.location
                       ? `${opportunity.location.city?.name || ''}${opportunity.location.city?.name && opportunity.location.state?.name ? ', ' : ''}${opportunity.location.state?.name || ''} ${opportunity.location.zip || ''}`.trim() || 'N/A'
                       : 'N/A'
                     }
                   </CardDescription>
                    <CardDescription>Office Address: {opportunity.officeAddress || 'N/A'}</CardDescription>
                   <CardDescription>
                      Closing Date: {opportunity.closingDate ? format(new Date(opportunity.closingDate), 'PPP') : 'N/A'}
                   </CardDescription>
                    {/* Display Truncated Description */}
                    <CardDescription className="pt-2 text-foreground">
                        Description: {truncateDescription(descriptions[opportunity.id] || opportunity.description, 50)}
                    </CardDescription>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                   <Button asChild size="sm" className="w-full">
                     <Link href={`/sam-gov/${opportunity.id}`}>
                       View Details
                     </Link>
                   </Button>
                </div>
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