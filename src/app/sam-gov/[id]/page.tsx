'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSamGovOpportunities, SamGovOpportunity } from '@/services/sam-gov';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { Icons } from '@/components/icons';
import { format } from 'date-fns';

export default function SamGovOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // Assuming id is always present
  const [opportunity, setOpportunity] = useState<SamGovOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunityDetails = async () => {
      if (!id) return; // Guard against missing ID

      setLoading(true);
      setError(null);
      setDescription(null); // Reset description

      try {
        // Fetch all opportunities (or specific one if API supports it)
        // Using the cached approach from getSamGovOpportunities
        const allOpportunities = await getSamGovOpportunities({});
        const foundOpportunity = allOpportunities.find(opp => opp.id === id);

        if (foundOpportunity) {
          setOpportunity(foundOpportunity);

          // Check if description is a URL and fetch it
          if (foundOpportunity.description && foundOpportunity.description.startsWith('http')) {
            const apiKey = process.env.NEXT_PUBLIC_SAM_GOV_API_KEY;
            if (!apiKey) {
              console.warn('API key missing, cannot fetch full description.');
              setDescription('API key missing, full description unavailable.');
            } else {
              try {
                const descResponse = await fetch(`${foundOpportunity.description}&api_key=${apiKey}`);
                if (descResponse.ok) {
                  const descData = await descResponse.json();
                  // Extract the actual description text from the response structure
                  // Adjust the path based on the actual API response format for descriptions
                  const actualDesc = descData?.description || descData?.opportunity?.description || 'Full description not found in response.';
                  setDescription(actualDesc);
                } else {
                  console.error(`Failed to fetch description (${descResponse.status})`);
                  setDescription('Failed to load full description.');
                }
              } catch (descError) {
                console.error('Error fetching description:', descError);
                setDescription('Error loading full description.');
              }
            }
          } else {
            // Use the potentially truncated description if it's not a URL
            setDescription(foundOpportunity.description || 'No description available.');
          }
        } else {
          setError('Opportunity not found.');
          setOpportunity(null);
        }
      } catch (err: any) {
        console.error('Error fetching opportunity details:', err);
        setError(err.message || 'Failed to load opportunity details.');
        setOpportunity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunityDetails();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p>Opportunity details could not be loaded.</p>
      </main>
    );
  }

  // Helper to safely render location
  const renderLocation = (loc: SamGovOpportunity['location']) => {
    if (!loc) return 'N/A';
    return `${loc.city?.name || ''}${loc.city?.name && loc.state?.name ? ', ' : ''}${loc.state?.name || ''} ${loc.zip || ''}`.trim() || 'N/A';
  };

  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-secondary/30 to-background animate-fadeIn">
      <div className="container mx-auto max-w-4xl">
        <Button onClick={() => router.back()} variant="outline" className="mb-6 group transition-transform hover:-translate-x-1">
          <Icons.arrowRight className="mr-2 h-4 w-4 transform rotate-180 group-hover:animate-pulse" />
          Back to Listings
        </Button>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg overflow-hidden border-primary/20 animate-slideUp">
          <CardHeader className="bg-primary/10 p-6 border-b border-primary/20">
            <CardTitle className="text-2xl font-bold text-primary line-clamp-3">{opportunity.title || 'N/A'}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-2">Notice ID: {opportunity.id}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">NAICS Code</Label>
                <p>{opportunity.ncode || 'N/A'}</p>
              </div>
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Department</Label>
                <p>{opportunity.department || 'N/A'}</p>
              </div>
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Subtier</Label>
                <p>{opportunity.subtier || 'N/A'}</p>
              </div>
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Office</Label>
                <p>{opportunity.office || 'N/A'}</p>
              </div>
               <div className="opacity-90 transition-opacity hover:opacity-100">
                 <Label className="font-semibold text-primary">Original Link</Label>
                  <a
                      href={opportunity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline break-all flex items-center gap-1"
                  >
                      View on SAM.gov <Icons.externalLink className="h-3 w-3"/>
                  </a>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Type</Label>
                <p>{opportunity.type || 'N/A'}</p>
              </div>
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Execute Location</Label>
                <p>{renderLocation(opportunity.location)}</p>
              </div>
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Office Address</Label>
                <p>{opportunity.officeAddress || 'N/A'}</p>
              </div>
              <div className="opacity-90 transition-opacity hover:opacity-100">
                <Label className="font-semibold text-primary">Closing Date</Label>
                <p>{opportunity.closingDate ? format(new Date(opportunity.closingDate), 'PPP HH:mm zzz') : 'N/A'}</p>
              </div>
            </div>

            {/* Full Width Description */}
            <div className="md:col-span-2 pt-4 border-t mt-4">
              <Label className="text-xl font-semibold text-primary mb-2 block">Description</Label>
              {description === null ? (
                 <Skeleton className="h-20 w-full" /> // Show skeleton while description loads
               ) : (
                // Use prose for better text formatting, break-words to prevent overflow
                 <p className="text-foreground prose prose-sm max-w-none break-words whitespace-pre-wrap">{description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Tailwind CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
