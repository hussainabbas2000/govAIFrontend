
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SamGovOpportunity } from '@/types/sam-gov'; // Updated import
import { summarizeContractOpportunity, SummarizeContractOpportunityOutput } from '@/ai/flows/summarize-contract-opportunity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, List, FileText, Edit, AlertCircle, ShoppingCart, CalendarDays } from 'lucide-react';
import type { OngoingBid } from '@/app/page';
import { format, parseISO } from 'date-fns';

interface BidSummary extends SummarizeContractOpportunityOutput {
  title: string;
  id: string;
  agency: string;
  originalOpportunityLink?: string;
  originalClosingDate?: string;
}

export default function BidSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [summary, setSummary] = useState<BidSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchAndSummarizeOpportunity = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sam-gov?id=${id}`); // Fetch specific opportunity
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const opportunities: SamGovOpportunity[] = await response.json();
        const opportunity = opportunities.find(op => op.id === id); // Ensure we find the correct one if API returns array

        if (!opportunity) {
          throw new Error('Opportunity not found.');
        }

        console.log("Calling AI to summarize opportunity:", opportunity);
        const aiSummary = await summarizeContractOpportunity({ opportunity });
        console.log("AI Summary received:", aiSummary);

        setSummary({
          ...aiSummary,
          title: opportunity.title,
          id: opportunity.id,
          agency: opportunity.department || 'N/A',
          originalOpportunityLink: opportunity.link,
          originalClosingDate: opportunity.closingDate,
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
  }, [id, isClient]);

  const handleStartBiddingProcess = () => {
    if (!summary || !isClient) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const existingBidsString = localStorage.getItem('ongoingBids');
      let existingBids: OngoingBid[] = [];
      if (existingBidsString) {
        try {
          existingBids = JSON.parse(existingBidsString);
          if (!Array.isArray(existingBids)) {
            console.warn("Corrupted 'ongoingBids' in localStorage was not an array. Resetting.");
            existingBids = [];
          }
        } catch (e) {
          console.error("Failed to parse existing bids from localStorage, resetting.", e);
          localStorage.removeItem('ongoingBids');
        }
      }

      const bidIndex = existingBids.findIndex(b => b.id === summary.id);

      if (bidIndex !== -1) {
        // Update status if it's not already "Drafting" or a later stage that implies drafting is done.
        // For simplicity, if it exists, we assume it's being worked on.
        // If specific state progression is needed, add more checks here.
        // For now, just ensuring it's marked as "Drafting" if the user re-initiates.
        if (existingBids[bidIndex].status !== "Drafting") {
             existingBids[bidIndex].status = "Drafting";
        }
        console.log(`Bid ${summary.id} already exists, status confirmed/updated to Drafting.`);
      } else {
        const newBid: OngoingBid = {
          id: summary.id,
          title: summary.title,
          agency: summary.agency,
          status: "Drafting", // Initial state when bidding process starts
          deadline: summary.originalClosingDate || 'N/A',
          source: 'SAM.gov', // Assuming this page is for SAM.gov items
          linkToOpportunity: summary.originalOpportunityLink || `/sam-gov/${summary.id}`,
        };
        existingBids.push(newBid);
        console.log(`Bid ${summary.id} added to ongoing bids with status Drafting.`);
      }

      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      console.log("Bidding process started for:", summary.id);
      // Optionally, provide feedback to the user (e.g., toast notification)
      // Example: toast({ title: "Bidding Process Started", description: `Bid for "${summary.title}" is now in Drafting.` });

    } catch (e: any) {
      console.error("Error processing bid start:", e);
      setSubmissionError(e.message || "Failed to update bid status.");
       // Example: toast({ variant: "destructive", title: "Error", description: e.message || "Failed to update bid status." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToQuoteRequest = () => {
    if (!summary || !isClient) return;
    handleStartBiddingProcess(); 

    const existingBidsString = localStorage.getItem('ongoingBids');
    let existingBids: OngoingBid[] = [];
    if (existingBidsString) {
      try {
        existingBids = JSON.parse(existingBidsString);
      } catch (e) {
        console.error("Failed to parse existing bids from localStorage for RFQ", e);
        localStorage.removeItem('ongoingBids');
      }
    }

    const bidIndex = existingBids.findIndex(b => b.id === summary.id);
    if (bidIndex !== -1) {
      existingBids[bidIndex].status = "RFQs Sent"; // Update status
      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      console.log(`Bid ${summary.id} status updated to RFQs Sent.`);
    } else {
      // This case should ideally be handled by handleStartBiddingProcess,
      // but as a fallback, ensure the bid is added if somehow missed.
      console.warn(`Bid ${summary.id} not found in ongoing bids to update for RFQ. Adding it now.`);
       const newBid: OngoingBid = {
        id: summary.id,
        title: summary.title,
        agency: summary.agency,
        status: "RFQs Sent",
        deadline: summary.originalClosingDate || 'N/A',
        source: 'SAM.gov',
        linkToOpportunity: summary.originalOpportunityLink || `/sam-gov/${summary.id}`,
      };
      existingBids.push(newBid);
      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
    }
    
    router.push(`/rfq/${summary.id}`);
  };


  if (loading) {
    return <Loading />;
  }

  if (error && !isSubmitting) { 
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

  if (!summary && !loading && !error) { 
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p>Bid summary could not be loaded.</p>
         <Button onClick={() => router.back()} variant="secondary" className="mt-4">
             Go Back
           </Button>
      </main>
    );
  }
  
  const formattedDeadline = summary?.deadline 
    ? format(parseISO(summary.deadline), 'MM/dd/yyyy - HH:mm') 
    : <Skeleton className="inline-block h-5 w-2/5" />;


  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-background to-secondary/20 animate-fadeIn">
      <div className="container mx-auto max-w-3xl">
        <Button onClick={() => router.back()} variant="outline" className="mb-6 group transition-transform hover:-translate-x-1">
           <Icons.arrowRight className="mr-2 h-4 w-4 transform rotate-180 group-hover:animate-pulse" />
          Back to Opportunity Details
        </Button>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg animate-slideUp border-primary/10">
          <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
             <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-primary flex items-center">
                <FileText className="h-6 w-6 mr-3 text-primary" /> Bid Summary
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => alert("Edit summary feature not implemented.")} aria-label="Edit Summary">
                <Edit className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Button>
            </div>
            <CardDescription className="text-sm text-muted-foreground pt-1">
              Key details extracted for: {summary?.title || <Skeleton className="inline-block h-5 w-3/5" />} (ID: {summary?.id || <Skeleton className="inline-block h-5 w-1/5" />})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col space-y-2 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
              <Label className="text-sm font-medium text-muted-foreground flex items-center">
                <List className="h-4 w-4 mr-2 text-primary" /> Required Products/Services
              </Label>
              {summary ? (
                summary.requiredProductService?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    {summary.requiredProductService.map((item, index) => (
                      <li key={index} className="text-base font-medium text-foreground">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base font-medium text-foreground italic">None specified</p>
                )
              ) : (
                <Skeleton className="h-20 w-full" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center">
                    <Icons.packageSearch className="h-4 w-4 mr-2 text-primary" /> Estimated Quantities
                  </Label>
                  {summary ? (
                      Object.keys(summary.quantities || {}).length > 0 ? (
                        <div className="text-base font-medium text-foreground">
                          {Object.entries(summary.quantities).map(([product, quantity]) => (
                              <p key={product}>
                                  {product}: {quantity}
                              </p>
                          ))}
                        </div>
                      ) : (
                          <p className="text-base font-medium text-foreground italic">None specified</p>
                      )
                  ) : (
                    <Skeleton className="h-12 w-full" />
                  )}
                </div>

                <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary" /> Deadline
                  </Label>
                  <p className="text-base font-medium text-foreground">{formattedDeadline}</p>
                </div>

                <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <Icons.mapPin className="h-4 w-4 mr-2 text-primary" /> Location
                </Label>
                {summary ? (
                    <p className="text-base font-medium text-foreground">{summary.location}</p>
                ) : (
                   <Skeleton className="h-6 w-3/4" />
                )}
                </div>
            </div>
            
            {submissionError && (
                <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Submission Error</AlertTitle>
                    <AlertDescription>{submissionError}</AlertDescription>
                </Alert>
            )}

            <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Button variant="outline" onClick={handleStartBiddingProcess} disabled={isSubmitting || !summary}>
                {isSubmitting && !submissionError ? <Icons.loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                {/* Check if bid already exists and is in "Drafting" */}
                {isClient && summary && localStorage.getItem('ongoingBids') && JSON.parse(localStorage.getItem('ongoingBids')!).find((b: OngoingBid) => b.id === summary.id && b.status === "Drafting") 
                  ? "Update Bid Draft" 
                  : "Start Bidding Process"}
              </Button>
              <Button onClick={handleProceedToQuoteRequest} disabled={!summary}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Proceed to Quote Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
