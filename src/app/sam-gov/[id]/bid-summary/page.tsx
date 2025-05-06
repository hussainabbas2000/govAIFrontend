'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSamGovOpportunities, SamGovOpportunity } from '@/services/sam-gov';
import { summarizeContractOpportunity, SummarizeContractOpportunityOutput } from '@/ai/flows/summarize-contract-opportunity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, List } from 'lucide-react'; // Import Terminal and List icons

interface BidSummary extends SummarizeContractOpportunityOutput {
  title: string;
  id: string;
}

export default function BidSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [summary, setSummary] = useState<BidSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndSummarizeOpportunity = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch the specific opportunity details
        // Using the cached/dummy data approach from getSamGovOpportunities
        const allOpportunities = await getSamGovOpportunities({});
        const opportunity = allOpportunities.find(opp => opp.id === id);

        if (!opportunity) {
          throw new Error('Opportunity not found.');
        }

        // 2. Call the AI summarization flow
        console.log("Calling AI to summarize opportunity:", opportunity);
        const aiSummary = await summarizeContractOpportunity({ opportunity });
        console.log("AI Summary received:", aiSummary);

        setSummary({
          ...aiSummary,
          title: opportunity.title, // Add original title for context
          id: opportunity.id,
        });

      } catch (err: any) {
        console.error('Error fetching or summarizing opportunity:', err);
        setError(err.message || 'Failed to load bid summary.');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSummarizeOpportunity();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="w-full max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Summary</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
           <Button onClick={() => router.back()} variant="secondary" className="mt-4">
             Go Back
           </Button>
        </Alert>
      </main>
    );
  }

  if (!summary) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p>Bid summary could not be loaded.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-background to-secondary/20 animate-fadeIn">
      <div className="container mx-auto max-w-2xl">
        <Button onClick={() => router.back()} variant="outline" className="mb-6 group transition-transform hover:-translate-x-1">
           <Icons.arrowRight className="mr-2 h-4 w-4 transform rotate-180 group-hover:animate-pulse" />
          Back to Opportunity Details
        </Button>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg animate-slideUp border-primary/10">
          <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
            <CardTitle className="text-2xl font-semibold text-primary">Bid Summary</CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-1">
              Key details extracted for: {summary.title} (ID: {summary.id})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col space-y-2 p-4 border rounded-md bg-background shadow-sm">
              <Label className="text-sm font-medium text-muted-foreground flex items-center">
                <List className="h-4 w-4 mr-2" /> Required Products/Services
              </Label>
              {summary.requiredProductService?.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {summary.requiredProductService.map((item, index) => (
                    <li key={index} className="text-lg font-medium text-foreground">{item}</li>
                  ))}
                </ul>
              ) : (
                 summary.requiredProductService ? <p className="text-lg font-medium text-foreground italic">None specified</p> : <Skeleton className="h-6 w-3/4" />
              )}
            </div>

            <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm">
              <Label className="text-sm font-medium text-muted-foreground">Estimated Quantity / Scale</Label>
              <p className="text-lg font-medium text-foreground">{summary.quantity || <Skeleton className="h-6 w-1/2" />}</p>
            </div>

            <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm">
              <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
              <p className="text-lg font-medium text-foreground">{summary.deadline || <Skeleton className="h-6 w-1/4" />}</p>
            </div>

            <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm">
              <Label className="text-sm font-medium text-muted-foreground">Location</Label>
              <p className="text-lg font-medium text-foreground">{summary.location || <Skeleton className="h-6 w-1/2" />}</p>
            </div>

            {/* Placeholder for next steps/buttons */}
            <div className="mt-8 pt-6 border-t flex justify-end space-x-3">
              <Button variant="outline">Save Summary</Button>
              <Button>Proceed to Quote Request</Button>
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
          animation: fadeIn 0.6s ease-out forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
