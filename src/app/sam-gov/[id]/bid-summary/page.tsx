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
import { Terminal, List, FileText, Edit, AlertCircle, ShoppingCart } from 'lucide-react'; // Import Terminal and List icons
import type { OngoingBid } from '@/app/page'; // Import OngoingBid type

interface BidSummary extends SummarizeContractOpportunityOutput {
  title: string;
  id: string;
  agency: string; // Add agency for OngoingBid
  originalOpportunityLink?: string; // Link to the original opportunity
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
        // 1. Fetch the specific opportunity details
        const allOpportunities = await getSamGovOpportunities({}); // Assuming this can fetch/filter by ID or you filter client-side
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
          title: opportunity.title,
          id: opportunity.id,
          agency: opportunity.department || 'N/A', // Use department as agency
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
          if (!Array.isArray(existingBids)) { // Ensure it's an array
            console.warn("Corrupted 'ongoingBids' in localStorage was not an array. Resetting.");
            existingBids = [];
          }
        } catch (e) {
          console.error("Failed to parse existing bids from localStorage, resetting.", e);
          localStorage.removeItem('ongoingBids'); // Clear corrupted data
        }
      }

      const bidIndex = existingBids.findIndex(b => b.id === summary.id);

      if (bidIndex !== -1) {
        // Update existing bid status if necessary (though "Drafting" is usually the first state)
        if (existingBids[bidIndex].status !== "Drafting") {
            existingBids[bidIndex].status = "Drafting"; // Or a relevant initial status
        }
        console.log(`Bid ${summary.id} already exists, status confirmed/updated to Drafting.`);
      } else {
        // Add new bid if it doesn't exist
        const newBid: OngoingBid = {
          id: summary.id,
          title: summary.title,
          agency: summary.agency,
          status: "Drafting", // Initial status when bidding process starts
          deadline: summary.originalClosingDate || 'N/A',
          source: 'SAM.gov', // Assuming this page is for SAM.gov
          linkToOpportunity: summary.originalOpportunityLink || `/sam-gov/${summary.id}`,
        };
        existingBids.push(newBid);
        console.log(`Bid ${summary.id} added to ongoing bids with status Drafting.`);
      }

      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      // Optionally, navigate or show a success message
      // router.push('/'); // Example: Navigate to dashboard after starting
      // For now, let's assume we stay on this page or proceed to RFQ
      console.log("Bidding process started for:", summary.id);

    } catch (e: any) {
      console.error("Error processing bid start:", e);
      setSubmissionError(e.message || "Failed to update bid status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToQuoteRequest = () => {
    if (!summary || !isClient) return;
    handleStartBiddingProcess(); // Ensure bid is marked as started/drafting

    // Update the bid status to "RFQs Sent" before navigating
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
      existingBids[bidIndex].status = "RFQs Sent";
      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      console.log(`Bid ${summary.id} status updated to RFQs Sent.`);
    } else {
      // This case should ideally not happen if handleStartBiddingProcess worked
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
      existingBids.push(newBid); // Add if somehow missed
      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
    }
    
    router.push(`/rfq/${summary.id}`);
  };


  if (loading) {
    return <Loading />;
  }

  if (error && !isSubmitting) { // Don't show main error if submitting error occurs
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

  if (!summary && !loading && !error) { // Handle case where summary is null but no error/loading
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p>Bid summary could not be loaded.</p>
         <Button onClick={() => router.back()} variant="secondary" className="mt-4">
             Go Back
           </Button>
      </main>
    );
  }


  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-background to-secondary/20 animate-fadeIn">
      <div className="container mx-auto max-w-3xl"> {/* Max width increased slightly */}
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
                <Skeleton className="h-6 w-3/4" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed to md:grid-cols-2 for better layout on medium screens */}
                <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
                <Label className="text-sm font-medium text-muted-foreground">Estimated Quantities</Label>
                {summary ? (
                    Object.keys(summary.quantities || {}).length > 0 ? (
                        Object.entries(summary.quantities).map(([product, quantity]) => (
                            <p key={product} className="text-base font-medium text-foreground">
                                {product}: {quantity}
                            </p>
                        ))
                    ) : (
                        <p className="text-base font-medium text-foreground italic">None specified</p>
                    )
                ) : (
                    <Skeleton className="h-6 w-full" />
                )}
                </div>

                <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
                <Label className="text-sm font-medium text-muted-foreground">Deadline</Label>
                {summary ? (
                    <p className="text-base font-medium text-foreground">{summary.deadline}</p>
                ) : (
                    <Skeleton className="h-6 w-1/4" />
                )}
                </div>

                <div className="flex flex-col space-y-1 p-4 border rounded-md bg-background shadow-sm transition-shadow hover:shadow-md">
                <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                {summary ? (
                    <p className="text-base font-medium text-foreground">{summary.location}</p>
                ) : (
                    <Skeleton className="h-6 w-1/2" />
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
                {existingBidIsDrafting() ? "Update Bid Draft" : "Start Bidding Process"}
              </Button>
              <Button onClick={handleProceedToQuoteRequest} disabled={isSubmitting || !summary || !existingBidIsDrafting()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Proceed to Quote Request
              </Button>
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

  function existingBidIsDrafting() {
    if (!summary || !isClient) return false;
    const existingBidsString = localStorage.getItem('ongoingBids');
    if (!existingBidsString) return false;
    try {
      const existingBids: OngoingBid[] = JSON.parse(existingBidsString);
      const bid = existingBids.find(b => b.id === summary.id);
      return bid?.status === "Drafting";
    } catch (e) {
      return false;
    }
  }
}
