// app/sam-gov/[id]/bid-summary/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import Loading from '@/app/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface Supplier {
  id: number;
  company_name: string;
  status: string;
  negotiation_round: number;
  messages: Message[];
  metrics?: {
    initial_price: string;
    final_price: string;
    savings: string;
    savings_percent: string;
  };
}

interface Message {
  sender: 'buyer' | 'supplier';
  content: string;
  price_mentioned?: number;
  created_at?: string;
}

interface NegotiationSession {
  id: number;
  status: string;
  suppliers: Supplier[];
  opportunity_id: string;
  created_at: string;
}

export default function BidSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;

  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [numSuppliers, setNumSuppliers] = useState('5');
  const [negotiationSession, setNegotiationSession] = useState<NegotiationSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if(!opportunityId) return
    fetchOpportunityDetails();
  }, [opportunityId]);

  useEffect(() => {
    if (negotiationSession) {
      const interval = setInterval(fetchNegotiationStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [negotiationSession]);

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sam-gov`);
      const allOpportunities = await response.json();
      const foundOpportunity = allOpportunities.find((opp: any) => opp.id === opportunityId);
      
      if (foundOpportunity) {
        setOpportunity(foundOpportunity);
        
        // Fetch detailed description if it's a URL
        if (foundOpportunity.description?.startsWith('http')) {
          try {
            const descResponse = await fetch(foundOpportunity.description);
            const text = await descResponse.text();
            foundOpportunity.fullDescription = text.replace(/<[^>]+>/g, '');
          } catch (e) {
            foundOpportunity.fullDescription = foundOpportunity.description;
          }
        } else {
          foundOpportunity.fullDescription = foundOpportunity.description;
        }
      }
    } catch (err) {
      setError('Failed to load opportunity details');
    } finally {
      setLoading(false);
    }
  };

  const startNegotiation = async () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      setError('Please enter a valid target price');
      return;
    }
    let savedData = localStorage.getItem(`summary-${opportunityId}`)
    if(!savedData) return;
    const parsedData = JSON.parse(savedData)
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/sam-gov/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity:parsedData,
          targetPrice: parseFloat(targetPrice),
          additionalRequirements,
          numSuppliers: parseInt(numSuppliers),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start negotiation');
      }

      const data = await response.json();
      setNegotiationSession(data);
    } catch (err) {
      setError('Failed to start negotiation process');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchNegotiationStatus = async () => {
    if (!negotiationSession) return;

    try {
      const response = await fetch(`/api/sam-gov/negotiate/${negotiationSession.id}`);
      const data = await response.json();
      setNegotiationSession(data);
    } catch (err) {
      console.error('Failed to fetch negotiation status:', err);
    }
  };

  const respondToSupplier = async (supplierId: number) => {
    try {
      await fetch(`/api/sam-gov/negotiate/${negotiationSession?.id}/respond/${supplierId}`, {
        method: 'POST',
      });
      fetchNegotiationStatus();
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  };

  const acceptQuote = async (supplierId: number) => {
    try {
      await fetch(`/api/sam-gov/negotiate/${negotiationSession?.id}/accept/${supplierId}`, {
        method: 'POST',
      });
      fetchNegotiationStatus();
    } catch (err) {
      console.error('Failed to accept quote:', err);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 bg-gradient-to-br from-secondary/20 to-background">
      <div className="container mx-auto max-w-6xl">
        <Button 
          onClick={() => router.back()} 
          variant="outline" 
          className="mb-6"
        >
          <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Details
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Opportunity Summary */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Opportunity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Title</Label>
                  <p className="text-sm font-medium line-clamp-2">{opportunity.title}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Notice ID</Label>
                  <p className="text-sm font-mono">{opportunity.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Department</Label>
                  <p className="text-sm">{opportunity.department || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">NAICS Code</Label>
                  <p className="text-sm">{opportunity.ncode || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <Badge variant="secondary">{opportunity.type || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Closing Date</Label>
                  <p className="text-sm">
                    {opportunity.closingDate 
                      ? format(new Date(opportunity.closingDate), 'PPP')
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2">
            {!negotiationSession ? (
              <Card>
                <CardHeader>
                  <CardTitle>Start Bidding Process</CardTitle>
                  <CardDescription>
                    Set your target price and requirements to begin automated supplier negotiations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="targetPrice">
                        Target Price ($) *
                        <span className="text-xs text-muted-foreground ml-2">
                          This will not be revealed to suppliers
                        </span>
                      </Label>
                      <Input
                        id="targetPrice"
                        type="number"
                        placeholder="Enter your maximum budget"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numSuppliers">Number of Suppliers to Contact</Label>
                      <select
                        id="numSuppliers"
                        className="w-full p-2 border rounded-md"
                        value={numSuppliers}
                        onChange={(e) => setNumSuppliers(e.target.value)}
                      >
                        <option value="3">3 Suppliers</option>
                        <option value="5">5 Suppliers</option>
                        <option value="7">7 Suppliers</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="requirements">
                        Additional Requirements
                        <span className="text-xs text-muted-foreground ml-2">
                          (Optional - specific needs, certifications, etc.)
                        </span>
                      </Label>
                      <Textarea
                        id="requirements"
                        placeholder="Enter any specific requirements or preferences..."
                        value={additionalRequirements}
                        onChange={(e) => setAdditionalRequirements(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={startNegotiation}
                      disabled={submitting || !targetPrice}
                    >
                      {submitting ? (
                        <>
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                          Starting Negotiations...
                        </>
                      ) : (
                        <>
                          <Icons.arrowRight className="mr-2 h-4 w-4" />
                          Start Automated Negotiations
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Negotiation in Progress</CardTitle>
                  <CardDescription>
                    AI-powered negotiations with {negotiationSession.suppliers.length} suppliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="0" className="w-full">
                    <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-6">
                      {negotiationSession.suppliers.map((supplier, idx) => (
                        <TabsTrigger key={supplier.id} value={idx.toString()}>
                          <div className="text-center">
                            <div className="text-xs truncate max-w-[100px]">
                              {supplier.company_name}
                            </div>
                            <Badge 
                              variant={
                                supplier.status === 'completed' ? 'default' : 
                                supplier.status === 'negotiating' ? 'secondary' : 
                                'outline'
                              }
                              className="mt-1 text-xs"
                            >
                              {supplier.status}
                            </Badge>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {negotiationSession.suppliers.map((supplier, idx) => (
                      <TabsContent key={supplier.id} value={idx.toString()}>
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">{supplier.company_name}</CardTitle>
                              <Badge variant={
                                supplier.status === 'completed' ? 'default' : 
                                supplier.status === 'negotiating' ? 'secondary' : 
                                'outline'
                              }>
                                Round {supplier.negotiation_round}/3
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[400px] pr-4">
                              <div className="space-y-4">
                                {supplier.messages.map((message, msgIdx) => (
                                  <div key={msgIdx}>
                                    <div className={`p-4 rounded-lg ${
                                      message.sender === 'buyer' 
                                        ? 'bg-primary/10 ml-8' 
                                        : 'bg-secondary/30 mr-8'
                                    }`}>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-sm">
                                          {message.sender === 'buyer' ? 'You' : supplier.company_name}
                                        </span>
                                        {message.price_mentioned && (
                                          <Badge variant="outline" className="text-xs">
                                            ${message.price_mentioned.toFixed(2)}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>

                            <Separator className="my-4" />

                            <div className="flex justify-between items-center">
                              {supplier.status !== 'completed' && supplier.negotiation_round < 3 && (
                                <Button
                                  onClick={() => respondToSupplier(supplier.id)}
                                  variant="default"
                                  size="sm"
                                >
                                  {supplier.messages.filter(m => m.sender === 'supplier').length === 0
                                    ? 'Get Initial Quote'
                                    : 'Continue Negotiation'}
                                </Button>
                              )}

                              {supplier.status === 'negotiating' && (
                                <Button
                                  onClick={() => acceptQuote(supplier.id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Accept Quote
                                </Button>
                              )}

                              {supplier.metrics && (
                                <Card className="p-3 bg-success/10">
                                  <div className="text-xs space-y-1">
                                    <div>Initial: ${supplier.metrics.initial_price}</div>
                                    <div>Final: ${supplier.metrics.final_price}</div>
                                    <div className="font-semibold text-success">
                                      Saved: ${supplier.metrics.savings} ({supplier.metrics.savings_percent}%)
                                    </div>
                                  </div>
                                </Card>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}