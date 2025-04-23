'use client';

import {useState, useEffect} from 'react';
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const itemsPerPage = 10;

export default function SeptaOpportunitiesPage() {
  const [septaOpportunities, setSeptaOpportunities] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/septa');
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          //Instead of throwing an error, handle the error case gracefully
          setSeptaOpportunities([{error: `HTTP error! status: ${response.status}`}]);//setOpportunities to an array with an error
          return;//early return, so that it does not attempt to parse the non existent json
        }
        const data = await response.json();
        setSeptaOpportunities(data);
      } catch (error) {
        console.error('Failed to fetch SEPTA opportunities:', error);
        setSeptaOpportunities([{error: 'Failed to fetch SEPTA opportunities'}]);
      }
    };

    fetchOpportunities();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to the first page when the search query changes
  };

  const filteredOpportunities = septaOpportunities?.filter(opportunity => {
    if (opportunity.error) return true; // Always show the error
    return (
      opportunity.Title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opportunity['Bid Number']?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2 className="text-3xl font-bold">SEPTA Opportunities</h2>
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
        {currentOpportunities[0]?.error ? (
          <div className="text-red-500">
            Error: {currentOpportunities[0].error}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {currentOpportunities.map((opportunity, index) => (
              <Card key={index} className="bg-card text-card-foreground shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{opportunity.Title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Bid Number: {opportunity['Bid Number']}</CardDescription>
                  <Button asChild>
                    <a href={opportunity.Link} target="_blank" rel="noopener noreferrer">
                      View Details
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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

