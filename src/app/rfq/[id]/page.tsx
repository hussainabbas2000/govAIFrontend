'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSamGovOpportunities, SamGovOpportunity } from '@/services/sam-gov';
import { summarizeContractOpportunity, SummarizeContractOpportunityOutput } from '@/ai/flows/summarize-contract-opportunity';
import { findProductPricing, FindProductPricingOutput, FindProductPricingInput } from '@/ai/flows/find-product-pricing-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { Icons } from '@/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, ExternalLink, Info, ListTree, Phone, ShoppingCart, Terminal } from 'lucide-react';
import Link from 'next/link';
import type { OngoingBid } from '@/app/page'; // Import OngoingBid type


interface BidSummary extends SummarizeContractOpportunityOutput {
  title: string;
  id: string;
}

export default function RfqPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [opportunity, setOpportunity] = useState<SamGovOpportunity | null>(null);
  const [bidSummary, setBidSummary] = useState<BidSummary | null>(null);
  const [pricingInfo, setPricingInfo] = useState<FindProductPricingOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !id) return;

    const fetchOpportunityAndPricing = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch opportunity details
        const allOpportunities = await getSamGovOpportunities({});
        const currentOpportunity = allOpportunities.find(opp => opp.id === id);
        if (!currentOpportunity) {
          throw new Error('Opportunity not found.');
        }
        setOpportunity(currentOpportunity);

        // 2. Fetch AI-generated bid summary
        const summaryOutput = await summarizeContractOpportunity({ opportunity: currentOpportunity });
        setBidSummary({
          ...summaryOutput,
          title: currentOpportunity.title,
          id: currentOpportunity.id,
        });

        // 3. Fetch product pricing using AI
        if (summaryOutput.requiredProductService && summaryOutput.quantity) {
          const pricingInput: FindProductPricingInput = {
            productList: summaryOutput.requiredProductService,
            quantityDetails: summaryOutput.quantity,
          };
          const pricingOutput = await findProductPricing(pricingInput);
          setPricingInfo(pricingOutput);
        } else {
          setPricingInfo({ pricedItems: [], totalAmount: 0 }); // Handle cases with no products/quantity
        }

      } catch (err: any) {
        console.error('Error fetching opportunity or pricing:', err);
        setError(err.message || 'Failed to load RFQ details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunityAndPricing();
  }, [id, isClient]);

  const handleProceedToBidSubmission = () => {
     if (!id || !isClient) return;
    // Update the bid status in localStorage
    const existingBidsString = localStorage.getItem('ongoingBids');
    let existingBids: OngoingBid[] = [];
    if (existingBidsString) {
      try {
        existingBids = JSON.parse(existingBidsString);
      } catch (e) {
        console.error("Failed to parse existing bids from localStorage", e);
        localStorage.removeItem('ongoingBids');
      }
    }

    const bidIndex = existingBids.findIndex(b => b.id === id);
    if (bidIndex !== -1) {
      existingBids[bidIndex].status = "Bid Submitted"; // Update to Bid Submitted
      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      console.log(`Bid ${id} status updated to Bid Submitted.`);
    } else {
      console.warn(`Bid ${id} not found in ongoing bids to update status.`);
    }
    alert("Bid status updated to 'Bid Submitted'. Bid Submission page/functionality not yet implemented.");
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="w-full max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading RFQ Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => router.back()} variant="secondary" className="mt-4">
            Go Back
          </Button>
        </Alert>
      </main>
    );
  }

  if (!opportunity || !bidSummary || !pricingInfo) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <p>RFQ details could not be fully loaded.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-background to-secondary/10 animate-fadeIn">
      <div className="container mx-auto max-w-4xl">
        <Button onClick={() => router.back()} variant="outline" className="mb-6 group transition-transform hover:-translate-x-1">
          <Icons.arrowRight className="mr-2 h-4 w-4 transform rotate-180 group-hover:animate-pulse" />
          Back to Bid Summary
        </Button>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-lg animate-slideUp border-primary/20">
          <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <ShoppingCart className="h-6 w-6 mr-3 text-primary" /> Request for Quotation (RFQ)
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-1">
              Pricing for: {bidSummary.title} (ID: {bidSummary.id})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {pricingInfo.pricedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">Item</TableHead>
                      <TableHead className="w-[15%]">Identified Qty</TableHead>
                      <TableHead className="text-right w-[15%]">Rate</TableHead>
                      <TableHead className="text-right w-[15%]">Subtotal</TableHead>
                      <TableHead className="w-[15%]">Website</TableHead>
                      <TableHead className="w-[15%]">Vendor Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingInfo.pricedItems.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.identifiedQuantity}</TableCell>
                        <TableCell className="text-right">
                          {item.rate > 0 ? `$${item.rate.toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.subtotal > 0 ? `$${item.subtotal.toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.websiteLink ? (
                            <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent hover:underline">
                              <a href={item.websiteLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                View <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {item.vendorContactInfo || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <ListTree className="h-4 w-4" />
                <AlertTitle>No Pricing Information</AlertTitle>
                <AlertDescription>
                  Could not retrieve specific pricing details for the items. This might be due to the nature of the products/services or lack of available online data.
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row justify-between items-center">
              <div className="text-lg font-bold text-primary flex items-center mb-4 sm:mb-0">
                <DollarSign className="h-6 w-6 mr-2" />
                Total Estimated Amount: ${pricingInfo.totalAmount.toFixed(2)}
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => alert("Save RFQ functionality not implemented.")}>Save RFQ</Button>
                <Button onClick={handleProceedToBidSubmission}>Proceed to Bid Submission</Button>
              </div>
            </div>

            <Alert variant="default" className="mt-6 bg-accent/5 text-accent-foreground border-accent/20">
              <Info className="h-4 w-4 text-accent" />
              <AlertTitle className="text-accent">Disclaimer</AlertTitle>
              <AlertDescription>
                The pricing information provided is AI-generated based on publicly available data and is for estimation purposes only. Actual prices may vary. Always verify with vendors.
              </AlertDescription>
            </Alert>

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
