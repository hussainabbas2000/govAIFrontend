
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { SamGovOpportunity } from '@/types/sam-gov'; // Updated import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { Icons } from '@/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, ExternalLink, Info, ListTree, Phone, ShoppingCart, Terminal, Layers } from 'lucide-react';
import Link from 'next/link';
import type { OngoingBid } from '@/app/page';




// --- Types for Flask API Response ---
interface FlaskApiOffer {
  seller: string;
  unit_price: number;
  quantity: number; 
  shipping: number | null;
  taxes: number | null;
  total_cost: number;
  url: string;
  contact_or_quote?: string; 
}

interface FlaskApiResponse {
  [productName: string]: FlaskApiOffer[];
}
// --- End Flask API Types ---

// Updated to align with Flask API response and UI needs
interface VendorOffer {
  vendorName?: string;      
  rate: number;             
  websiteLink?: string;     
  contactOrQuoteUrl?: string; 
  subtotal: number;         
  shipping?: number | null; 
  taxes?: number | null;    
  requestedQuantity?: number; 
}

interface ProductOffersGroup {
  productName: string;
  identifiedQuantity: string; 
  offers: VendorOffer[];
}

interface UiFindProductPricingOutput {
  productsWithOffers: ProductOffersGroup[];
  overallTotalAmount: number;
}


export default function RfqPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [opportunity, setOpportunity] = useState<SamGovOpportunity | null>(null);
  const [bidSummary, setBidSummary] = useState<any | null>(null);
  const [pricingInfo, setPricingInfo] = useState<UiFindProductPricingOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    if (!isClient || !id) return;

    const fetchOpportunityAndPricing = async () => {
      setLoading(true);
      setError(null);
      setPricingError(null);

      try {
        const samGovResponse = await fetch(`/api/sam-gov?id=${id}`);
        if (!samGovResponse.ok) {
            const errorData = await samGovResponse.json();
            throw new Error(errorData.error || `Failed to fetch opportunity details: ${samGovResponse.status}`);
        }
        const opportunities: SamGovOpportunity[] = await samGovResponse.json();
        const currentOpportunity = opportunities.find(opp => opp.id === id);

        if (!currentOpportunity) {
          throw new Error('Opportunity not found.');
        }
        setOpportunity(currentOpportunity);
        console.log("Current opportunity set:", currentOpportunity);

        const summaryOutput: any = localStorage.getItem('summary');
        const currentBidSummary = { 
          ...summaryOutput,
          title: currentOpportunity.title,
          id: currentOpportunity.id,
        };
        setBidSummary(currentBidSummary);
        console.log("AI Summary received:", (summaryOutput));
        


        const productQuantitiesForApi = summaryOutput.quantities;

        if (summaryOutput.product_service_breakdown.Requested_Product && summaryOutput.product_service_breakdown.Requested_Product.length > 0 && productQuantitiesForApi) {
          const productsForApi = summaryOutput.product_service_breakdown.Requested_Product.map((productName: string | number) => ({
            name: productName,
            quantity: productQuantitiesForApi[productName] || 1 
          }));

          console.log("Products for Flask API:", JSON.stringify(productsForApi, null, 2));

          const flaskApiPayload = {
            products: productsForApi,
          };
          console.log("Requesting bulk pricing with payload:", JSON.stringify(flaskApiPayload, null, 2));


          const flaskApiResponse = await fetch("http://127.0.0.1:4000/bulk-pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(flaskApiPayload),
          });

          if (!flaskApiResponse.ok) {
            const errorData = await flaskApiResponse.text();
            console.error("Flask API error response:", errorData);
            throw new Error(`Failed to fetch pricing from Flask API: ${flaskApiResponse.status} - ${errorData}`);
          }

          const flaskData: FlaskApiResponse = await flaskApiResponse.json();
          console.log("Received Flask API pricing info:", JSON.stringify(flaskData, null, 2));

          
          const transformedProductsWithOffers: ProductOffersGroup[] = Object.entries(flaskData).map(([productName, apiOffers]) => {
            const aiQuantityForProduct = currentBidSummary.quantities[productName] || (apiOffers && apiOffers.length > 0 ? apiOffers[0].quantity : 1);
            const identifiedQuantityForDisplay = `${aiQuantityForProduct} units of ${productName}`;


            const offers: VendorOffer[] = (apiOffers || []).map(apiOffer => ({
              vendorName: apiOffer.seller,
              rate: apiOffer.unit_price,
              websiteLink: apiOffer.url,
              contactOrQuoteUrl: apiOffer.contact_or_quote || apiOffer.url,
              subtotal: apiOffer.total_cost,
              shipping: apiOffer.shipping,
              taxes: apiOffer.taxes,
              requestedQuantity: apiOffer.quantity,
            }));
            return {
              productName,
              identifiedQuantity: identifiedQuantityForDisplay,
              offers,
            };
          });

          const overallTotalAmount = transformedProductsWithOffers.reduce((sum, productGroup) => {
            const bestOfferSubtotal = productGroup.offers.length > 0 ? productGroup.offers[0].subtotal : 0;
            return sum + bestOfferSubtotal;
          }, 0);
          
          setPricingInfo({
            productsWithOffers: transformedProductsWithOffers,
            overallTotalAmount,
          });

        } else {
          console.log("No required products/services or quantity found in summary. Setting empty pricing info.");
          setPricingInfo({ productsWithOffers: [], overallTotalAmount: 0 });
        }

      } catch (err: any) {
        console.error('Error fetching opportunity or pricing:', err);
        setError(err.message || 'Failed to load RFQ details.');
        if (err.message && err.message.includes("Flask API")) {
            setPricingError(err.message);
        }
        setPricingInfo({ productsWithOffers: [], overallTotalAmount: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunityAndPricing();
  }, [id, isClient]);

  const handleProceedToBidSubmission = () => {
     if (!id || !isClient || !bidSummary) return;
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
      existingBids[bidIndex].status = "Bid Submitted";
      localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      console.log(`Bid ${id} status updated to Bid Submitted.`);
    } else {
      console.warn(`Bid ${id} not found in ongoing bids to update status. Adding it now.`);
      if (opportunity && bidSummary) {
          const newBid: OngoingBid = {
            id: opportunity.id,
            title: opportunity.title,
            agency: opportunity.department || 'N/A',
            status: "Bid Submitted",
            deadline: opportunity.closingDate || 'N/A',
            source: 'SAM.gov',
            linkToOpportunity: `/sam-gov/${opportunity.id}`,
          };
          existingBids.push(newBid);
          localStorage.setItem('ongoingBids', JSON.stringify(existingBids));
      }
    }
    alert("Bid status updated to 'Bid Submitted'. Bid Submission page/functionality not yet implemented.");
  };

  if (loading && !opportunity) return <Loading />; 

  if (error && !opportunity) { 
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="w-full max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Opportunity Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => router.back()} variant="secondary" className="mt-4">
            Go Back
          </Button>
        </Alert>
      </main>
    );
  }

  const safeBidSummaryTitle = bidSummary?.title || opportunity?.title || "N/A";
  const safeBidSummaryId = bidSummary?.id || opportunity?.id || "N/A";
  const hasPricingData = pricingInfo && pricingInfo.productsWithOffers.some(p => p.offers.length > 0);

  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-background to-secondary/10 animate-fadeIn">
      <div className="container mx-auto max-w-5xl">
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
              Pricing for: {safeBidSummaryTitle} (ID: {safeBidSummaryId})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {loading && !pricingInfo && <div className="flex justify-center items-center py-10"><Icons.loader className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Fetching pricing information...</p></div>}
            {pricingError && opportunity && ( 
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Pricing Error</AlertTitle>
                    <AlertDescription>{pricingError}</AlertDescription>
                </Alert>
            )}
             {error && !pricingError && opportunity && ( 
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}


            {!loading && pricingInfo && (
              hasPricingData ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">Item</TableHead>
                      <TableHead className="w-[15%]">Identified Qty</TableHead>
                      <TableHead className="w-[15%]">Vendor</TableHead>
                      <TableHead className="text-right w-[10%]">Unit Rate</TableHead>
                      <TableHead className="text-right w-[10%]">Total Cost</TableHead>
                      <TableHead className="w-[15%]">Product Link</TableHead>
                      <TableHead className="w-[15%]">Contact/Quote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingInfo.productsWithOffers.map(productOfferGroup => (
                      productOfferGroup.offers.length > 0 ? (
                        productOfferGroup.offers.map((offer, offerIndex) => (
                          <TableRow key={`${productOfferGroup.productName}-${offer.vendorName || offerIndex}`} className="hover:bg-muted/50 transition-colors">
                            {offerIndex === 0 ? (
                              <TableCell rowSpan={productOfferGroup.offers.length} className="font-medium align-top border-r">
                                {productOfferGroup.productName}
                              </TableCell>
                            ) : null}
                             {offerIndex === 0 ? (
                              <TableCell rowSpan={productOfferGroup.offers.length} className="align-top border-r">
                                {productOfferGroup.identifiedQuantity}
                              </TableCell>
                            ) : null}
                            <TableCell className="font-medium">{offer.vendorName || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              {typeof offer.rate === 'number' && offer.rate > 0 ? `$${offer.rate.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {typeof offer.subtotal === 'number' && offer.subtotal > 0 ? `$${offer.subtotal.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {offer.websiteLink && offer.websiteLink !== "N/A" ? (
                                <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent hover:underline">
                                  <a href={offer.websiteLink.startsWith('http') ? offer.websiteLink : `http://${offer.websiteLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center break-all">
                                    View Product <ExternalLink className="h-3 w-3 ml-1 shrink-0" />
                                  </a>
                                </Button>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                               {offer.contactOrQuoteUrl && offer.contactOrQuoteUrl !== "N/A" ? (
                                <Button variant="link" size="sm" asChild className="p-0 h-auto text-accent hover:underline">
                                  <a href={offer.contactOrQuoteUrl.startsWith('http') ? offer.contactOrQuoteUrl : `http://${offer.contactOrQuoteUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center break-all">
                                    Contact/Quote <ExternalLink className="h-3 w-3 ml-1 shrink-0" />
                                  </a>
                                </Button>
                              ) : (
                                 'N/A'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow key={`${productOfferGroup.productName}-no-offers`}>
                           <TableCell className="font-medium border-r">{productOfferGroup.productName}</TableCell>
                           <TableCell className="border-r">{productOfferGroup.identifiedQuantity}</TableCell>
                           <TableCell colSpan={5} className="text-center text-muted-foreground italic">No offers found for this product.</TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <Layers className="h-4 w-4" />
                <AlertTitle>No Pricing Information Available</AlertTitle>
                <AlertDescription>
                  Could not retrieve specific pricing details for the items at this time. This might be due to the nature of the products/services or lack of available online data.
                </AlertDescription>
              </Alert>
            ))}

            { !loading && pricingInfo && (
                 <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row justify-between items-center">
                    <div className="text-lg font-bold text-primary flex items-center mb-4 sm:mb-0">
                        <DollarSign className="h-6 w-6 mr-2" />
                        Total Estimated Amount (Best Offers): ${pricingInfo?.overallTotalAmount?.toFixed(2) || '0.00'}
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={() => alert("Save RFQ functionality not implemented.")}>Save RFQ</Button>
                        <Button onClick={handleProceedToBidSubmission}>Proceed to Bid Submission</Button>
                    </div>
                </div>
            )}


            <Alert variant="default" className="mt-6 bg-accent/5 text-accent-foreground border-accent/20">
              <Info className="h-4 w-4 text-accent" />
              <AlertTitle className="text-accent">Disclaimer</AlertTitle>
              <AlertDescription>
                The pricing information provided is AI-assisted and based on automated web searches. It is for estimation purposes only. Actual prices may vary. Always verify with vendors.
                If "N/A" appears, it indicates that information could not be reliably retrieved. The "Total Estimated Amount" is based on the cheapest offer found for each product.
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
