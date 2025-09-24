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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  initial_messages?: InitialMessage[];
}

interface DraftResponse {
  draft: string;
  round: number;
  is_final_round: boolean;
}

interface InitialMessage {
  supplier_id: number;
  supplier_name: string;
  draft_message: string;
  sent?: boolean;
  edited_message?: string;
}

interface SupplierDraft {
  supplierId: number;
  draft: string;
  editedDraft: string;
  draftInfo: DraftResponse;
  isPending: boolean; // Draft exists but not sent
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
  
  // State for initial message review
  const [showInitialReview, setShowInitialReview] = useState(false);
  const [initialMessages, setInitialMessages] = useState<InitialMessage[]>([]);
  const [currentInitialIndex, setCurrentInitialIndex] = useState(0);
  const [sendingInitial, setSendingInitial] = useState(false);
  
  // State for draft editing during negotiation - IMPROVED
  const [supplierDrafts, setSupplierDrafts] = useState<Map<number, SupplierDraft>>(new Map());
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState<number | null>(null);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState<number | null>(null); // Track which supplier is generating
  const [gettingResponse, setGettingResponse] = useState<number | null>(null); // Track which supplier is getting response

  useEffect(() => {
    if(!opportunityId) return
    fetchOpportunityDetails();
  }, [opportunityId]);

  useEffect(() => {
    // Only auto-fetch if:
    // 1. We have a negotiation session
    // 2. We're not in initial review mode
    // 3. All initial messages have been sent
    if (negotiationSession && !showInitialReview) {
      const needsInitialMessages = initialMessages.length > 0 && initialMessages.some(m => !m.sent);
      
      if (!needsInitialMessages) {
        const interval = setInterval(fetchNegotiationStatus, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [negotiationSession, showInitialReview, initialMessages]);

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sam-gov`);
      const allOpportunities = await response.json();
      const foundOpportunity = allOpportunities.find((opp: any) => opp.id === opportunityId);
      
      if (foundOpportunity) {
        setOpportunity(foundOpportunity);
        
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
      
      // Set up initial message review with proper draft messages
      if (data.initial_messages || data.suppliers) {
        const messages = (data.initial_messages || data.suppliers.map((s: Supplier) => ({
          supplier_id: s.id,
          supplier_name: s.company_name,
          draft_message: `Subject: Request for Quote - Government Contract Opportunity

Dear ${s.company_name},

We are seeking competitive quotes from qualified suppliers for the following government contract opportunity:

${parsedData.title || 'Government Contract'}

Requirements:
- Complete pricing breakdown with all costs itemized
- Delivery timeline and milestones
- Compliance with all federal acquisition regulations
- Evidence of relevant past performance
- Quality assurance and control measures
${additionalRequirements ? `\nAdditional Requirements:\n${additionalRequirements}` : ''}

Target Budget Range: Competitive pricing expected

Please provide your most competitive proposal including any volume discounts or early delivery incentives.

We look forward to your response.

Best regards,
Procurement Team`
        }))).map((msg: InitialMessage) => ({
          ...msg,
          edited_message: msg.draft_message,
          sent: false
        }));
        setInitialMessages(messages);
        setShowInitialReview(true);
        setCurrentInitialIndex(0);
      }
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

  const sendInitialMessage = async (supplierId: number, content: string) => {
    if (!negotiationSession) return;
    
    try {
      setSendingInitial(true);
      
      const response = await fetch(
        `/api/sam-gov/negotiate/${negotiationSession.id}/send-initial/${supplierId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to send initial message');
      }
      
      // Mark message as sent
      setInitialMessages(prev => 
        prev.map(msg => 
          msg.supplier_id === supplierId 
            ? { ...msg, sent: true }
            : msg
        )
      );
      
      // Move to next supplier or complete
      if (currentInitialIndex < initialMessages.length - 1) {
        setCurrentInitialIndex(prev => prev + 1);
      } else {
        // All initial messages sent, refresh and show negotiation view
        setShowInitialReview(false);
        await fetchNegotiationStatus();
      }
      
    } catch (err) {
      console.error('Failed to send initial message:', err);
      setError('Failed to send initial message. Please try again.');
    } finally {
      setSendingInitial(false);
    }
  };

  const sendAllInitialMessages = async () => {
    for (let i = currentInitialIndex; i < initialMessages.length; i++) {
      const msg = initialMessages[i];
      if (!msg.sent) {
        await sendInitialMessage(msg.supplier_id, msg.edited_message || msg.draft_message);
      }
    }
  };

  // Get supplier response only (no draft generation)
  const getSupplierResponse = async (supplierId: number) => {
    try {
      setGettingResponse(supplierId);
      
      const response = await fetch(
        `/api/sam-gov/negotiate/${negotiationSession?.id}/respond/${supplierId}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get supplier response');
      }
      
      // Update the negotiation status to show the new supplier message
      await fetchNegotiationStatus();
      
    } catch (err) {
      console.error('Failed to get response:', err);
      setError('Failed to get supplier response. Please try again.');
    } finally {
      setGettingResponse(null);
    }
  };

  // Generate draft response (separate from getting supplier response)
  const generateDraftResponse = async (supplierId: number) => {
    try {
      setGeneratingDraft(supplierId);
      
      const draftResponse = await fetch(
        `/api/sam-gov/negotiate/${negotiationSession?.id}/draft/${supplierId}`,
        { method: 'POST' }
      );
      
      if (!draftResponse.ok) {
        throw new Error('Failed to generate draft response');
      }
      
      const draftData = await draftResponse.json();
      
      // Store the draft
      const newDraft: SupplierDraft = {
        supplierId,
        draft: draftData.draft,
        editedDraft: draftData.draft,
        draftInfo: draftData,
        isPending: true
      };
      
      setSupplierDrafts(prev => new Map(prev).set(supplierId, newDraft));
      
      // Open the modal
      setCurrentSupplierId(supplierId);
      setDraftModalOpen(true);
      
    } catch (err) {
      console.error('Failed to generate draft:', err);
      setError('Failed to generate draft response. Please try again.');
    } finally {
      setGeneratingDraft(null);
    }
  };

  // Open existing draft
  const openDraft = (supplierId: number) => {
    setCurrentSupplierId(supplierId);
    setDraftModalOpen(true);
  };

  const sendEditedResponse = async () => {
    if (!currentSupplierId || !negotiationSession) return;
    
    const draft = supplierDrafts.get(currentSupplierId);
    if (!draft) return;
    
    try {
      setSendingResponse(true);
      
      const response = await fetch(
        `/api/sam-gov/negotiate/${negotiationSession.id}/send/${currentSupplierId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: draft.editedDraft })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to send response');
      }
      
      // Remove the draft and close modal
      setSupplierDrafts(prev => {
        const newMap = new Map(prev);
        newMap.delete(currentSupplierId);
        return newMap;
      });
      
      setDraftModalOpen(false);
      setCurrentSupplierId(null);
      await fetchNegotiationStatus();
      
    } catch (err) {
      console.error('Failed to send response:', err);
      setError('Failed to send response. Please try again.');
    } finally {
      setSendingResponse(false);
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

  // Helper to determine what action is needed for a supplier
  const getSupplierActionState = (supplier: Supplier) => {
    const draft = supplierDrafts.get(supplier.id);
    const buyerMessages = supplier.messages.filter(m => m.sender === 'buyer').length;
    const supplierMessages = supplier.messages.filter(m => m.sender === 'supplier').length;
    
    if (supplier.status === 'completed') {
      return { type: 'completed', label: 'Negotiation Complete' };
    }
    
    if (draft?.isPending) {
      return { type: 'draft_pending', label: 'Draft Ready - Review & Send' };
    }
    
    if (buyerMessages === 0) {
      return { type: 'need_initial', label: 'Waiting for Initial Message' };
    }
    
    if (buyerMessages > supplierMessages) {
      return { type: 'awaiting_response', label: 'Awaiting Supplier Response' };
    }
    
    if (supplierMessages > buyerMessages) {
      return { type: 'need_draft', label: 'Generate Your Response' };
    }
    
    // When messages are equal, check if we need to generate a draft or get supplier response
    if (buyerMessages === supplierMessages && buyerMessages > 0) {
      // Get the last message to determine who sent it
      const lastMessage = supplier.messages[supplier.messages.length - 1];
      
      if (lastMessage?.sender === 'supplier') {
        // Supplier just responded, we need to generate our draft
        return { type: 'need_draft', label: 'Generate Your Response' };
      } else {
        // We just sent a message, waiting for supplier
        return { type: 'awaiting_response', label: 'Awaiting Supplier Response' };
      }
    }
    
    return { type: 'ready', label: 'Continue Negotiation' };
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

  const currentDraft = currentSupplierId ? supplierDrafts.get(currentSupplierId) : null;

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
                
                {targetPrice && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm text-muted-foreground">Your Target Price</Label>
                      <p className="text-sm font-semibold">${parseFloat(targetPrice).toFixed(2)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2">
            {!negotiationSession ? (
              // Initial setup card
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
                          Preparing Initial Messages...
                        </>
                      ) : (
                        <>
                          <Icons.arrowRight className="mr-2 h-4 w-4" />
                          Review & Send Initial Messages
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : showInitialReview ? (
              // Initial message review/edit
              <Card>
                <CardHeader>
                  <CardTitle>Review Initial Messages</CardTitle>
                  <CardDescription>
                    Review and customize your initial request for quote before sending to suppliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {initialMessages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">
                          Supplier {currentInitialIndex + 1} of {initialMessages.length}
                        </Badge>
                        <div className="flex gap-2">
                          {initialMessages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => !sendingInitial && setCurrentInitialIndex(idx)}
                              className={`w-8 h-2 rounded-full transition-colors cursor-pointer hover:opacity-80 ${
                                initialMessages[idx].sent 
                                  ? 'bg-green-500'
                                  : idx === currentInitialIndex 
                                    ? 'bg-primary' 
                                    : 'bg-gray-300'
                              }`}
                              disabled={sendingInitial}
                              title={`Go to supplier ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-2">
                          To: {initialMessages[currentInitialIndex].supplier_name}
                        </Label>
                        {initialMessages[currentInitialIndex].sent && (
                          <Badge variant="default" className="ml-2">Sent</Badge>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="initial-edit">
                          Your Message {initialMessages[currentInitialIndex].sent ? '(Already Sent)' : '(Edit as needed)'}
                        </Label>
                        <Textarea
                          id="initial-edit"
                          value={initialMessages[currentInitialIndex].edited_message || ''}
                          onChange={(e) => {
                            const newMessages = [...initialMessages];
                            newMessages[currentInitialIndex].edited_message = e.target.value;
                            setInitialMessages(newMessages);
                          }}
                          rows={16}
                          className="mt-2 font-mono text-sm"
                          placeholder="Edit your message here..."
                          disabled={initialMessages[currentInitialIndex].sent}
                        />
                      </div>

                      {!initialMessages[currentInitialIndex].sent && (
                        <Alert>
                          <AlertDescription>
                            This is your initial request for quote. Customize it for each supplier to get the best responses.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between items-center mt-6">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentInitialIndex(Math.max(0, currentInitialIndex - 1))}
                            disabled={currentInitialIndex === 0 || sendingInitial}
                          >
                            <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
                            Previous
                          </Button>
                          {currentInitialIndex < initialMessages.length - 1 && (
                            <Button
                              variant="outline"
                              onClick={() => setCurrentInitialIndex(currentInitialIndex + 1)}
                              disabled={sendingInitial}
                            >
                              Next
                              <Icons.arrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!initialMessages[currentInitialIndex].sent && (
                            <>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  const newMessages = [...initialMessages];
                                  newMessages[currentInitialIndex].edited_message = 
                                    newMessages[currentInitialIndex].draft_message;
                                  setInitialMessages(newMessages);
                                }}
                                disabled={sendingInitial}
                              >
                                Reset to Default
                              </Button>
                              <Button
                                onClick={() => sendInitialMessage(
                                  initialMessages[currentInitialIndex].supplier_id,
                                  initialMessages[currentInitialIndex].edited_message || 
                                  initialMessages[currentInitialIndex].draft_message
                                )}
                                disabled={sendingInitial || !initialMessages[currentInitialIndex].edited_message?.trim()}
                              >
                                {sendingInitial ? (
                                  <>
                                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : currentInitialIndex === initialMessages.length - 1 ? (
                                  'Send & Start Negotiations'
                                ) : (
                                  'Send & Continue'
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {initialMessages.some(m => !m.sent) && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="secondary"
                            onClick={sendAllInitialMessages}
                            disabled={sendingInitial}
                          >
                            Send All Remaining Messages
                          </Button>
                        </div>
                      )}

                      {initialMessages.every(m => m.sent) && (
                        <div className="mt-4 text-center">
                          <Button
                            onClick={() => {
                              setShowInitialReview(false);
                              fetchNegotiationStatus();
                            }}
                          >
                            View Negotiations
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Negotiation tabs
              <Card>
                <CardHeader>
                  <CardTitle>Negotiation in Progress</CardTitle>
                  <CardDescription>
                    Managing negotiations with {negotiationSession.suppliers.length} suppliers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="0" className="w-full">
                    <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-6">
                      {negotiationSession.suppliers.map((supplier, idx) => {
                        const actionState = getSupplierActionState(supplier);
                        const hasPendingDraft = supplierDrafts.get(supplier.id)?.isPending;
                        
                        return (
                          <TabsTrigger key={supplier.id} value={idx.toString()}>
                            <div className="text-center relative">
                              {hasPendingDraft && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                              )}
                              <div className="text-xs truncate max-w-[100px]">
                                {supplier.company_name}
                              </div>
                              <Badge 
                                variant={
                                  supplier.status === 'completed' ? 'default' : 
                                  hasPendingDraft ? 'destructive' :
                                  supplier.status === 'negotiating' ? 'secondary' : 
                                  'outline'
                                }
                                className="mt-1 text-xs"
                              >
                                {hasPendingDraft ? 'Draft Ready' : supplier.status}
                              </Badge>
                            </div>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {negotiationSession.suppliers.map((supplier, idx) => {
                      const actionState = getSupplierActionState(supplier);
                      const hasPendingDraft = supplierDrafts.get(supplier.id)?.isPending;
                      
                      return (
                        <TabsContent key={supplier.id} value={idx.toString()}>
                          <Card>
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">{supplier.company_name}</CardTitle>
                                <div className="flex gap-2">
                                  {hasPendingDraft && (
                                    <Badge variant="destructive" className="animate-pulse">
                                      Unsent Draft
                                    </Badge>
                                  )}
                                  <Badge variant={
                                    supplier.status === 'completed' ? 'default' : 
                                    supplier.status === 'negotiating' ? 'secondary' : 
                                    'outline'
                                  }>
                                    Round {supplier.negotiation_round}/3
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4">
                                  {supplier.messages.length === 0 && (
                                    <Alert>
                                      <AlertDescription>
                                        No messages yet. Send your initial request to start the negotiation.
                                      </AlertDescription>
                                    </Alert>
                                  )}
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

                              <div className="flex justify-between items-center gap-2">
                                {/* Action buttons based on state */}
                                {actionState.type === 'completed' && supplier.metrics && (
                                  <Card className="p-3 bg-success/10 w-full">
                                    <div className="text-xs space-y-1">
                                      <div>Initial Quote: ${supplier.metrics.initial_price}</div>
                                      <div>Final Quote: ${supplier.metrics.final_price}</div>
                                      <div className="font-semibold text-success">
                                        Saved: ${supplier.metrics.savings} ({supplier.metrics.savings_percent}%)
                                      </div>
                                    </div>
                                  </Card>
                                )}

                                {actionState.type === 'draft_pending' && (
                                  <>
                                    <Alert className="flex-1">
                                      <AlertDescription>
                                        You have an unsent draft response. Review and send it to continue.
                                      </AlertDescription>
                                    </Alert>
                                    <Button
                                      onClick={() => openDraft(supplier.id)}
                                      variant="default"
                                      size="sm"
                                    >
                                      Review & Send Draft
                                    </Button>
                                  </>
                                )}

                                {actionState.type === 'awaiting_response' && (
                                  <>
                                    <span className="text-sm text-muted-foreground">
                                      Waiting for supplier response...
                                    </span>
                                    <Button
                                      onClick={() => getSupplierResponse(supplier.id)}
                                      variant="outline"
                                      size="sm"
                                      disabled={gettingResponse === supplier.id}
                                    >
                                      {gettingResponse === supplier.id ? (
                                        <>
                                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                          Checking...
                                        </>
                                      ) : (
                                        'Check for Response'
                                      )}
                                    </Button>
                                  </>
                                )}

                                {actionState.type === 'need_draft' && (
                                  <>
                                    <Alert className="flex-1" variant="default">
                                      <AlertDescription>
                                        Supplier has responded. Generate your counter-offer.
                                      </AlertDescription>
                                    </Alert>
                                    <Button
                                      onClick={() => generateDraftResponse(supplier.id)}
                                      variant="default"
                                      size="sm"
                                      disabled={generatingDraft === supplier.id}
                                    >
                                      {generatingDraft === supplier.id ? (
                                        <>
                                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        'Generate Response'
                                      )}
                                    </Button>
                                  </>
                                )}

                                {actionState.type === 'ready' && (
                                  <Button
                                    onClick={() => getSupplierResponse(supplier.id)}
                                    variant="default"
                                    size="sm"
                                    disabled={gettingResponse === supplier.id}
                                  >
                                    {gettingResponse === supplier.id ? (
                                      <>
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        Getting Response...
                                      </>
                                    ) : (
                                      'Get Supplier Response'
                                    )}
                                  </Button>
                                )}

                                {supplier.status === 'negotiating' && supplier.messages.length > 0 && (
                                  <Button
                                    onClick={() => acceptQuote(supplier.id)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Accept Current Quote
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Draft Response Modal */}
        <Dialog open={draftModalOpen} onOpenChange={(open) => {
          if (!open && currentDraft?.isPending) {
            // Save the edited draft when closing
            if (currentSupplierId) {
              setSupplierDrafts(prev => {
                const newMap = new Map(prev);
                const draft = newMap.get(currentSupplierId);
                if (draft) {
                  newMap.set(currentSupplierId, draft);
                }
                return newMap;
              });
            }
          }
          setDraftModalOpen(open);
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review & Edit Your Response</DialogTitle>
              <DialogDescription>
                {currentDraft?.draftInfo && (
                  <span>
                    Round {currentDraft.draftInfo.round} of negotiation
                    {currentDraft.draftInfo.is_final_round && ' (Final Round)'}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {currentDraft && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2">
                    AI-Generated Draft Response
                  </Label>
                  <div className="p-3 bg-muted rounded-md max-h-48 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{currentDraft.draft}</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edited-draft">
                    Your Response (Edit as needed)
                  </Label>
                  <Textarea
                    id="edited-draft"
                    value={currentDraft.editedDraft}
                    onChange={(e) => {
                      if (currentSupplierId) {
                        setSupplierDrafts(prev => {
                          const newMap = new Map(prev);
                          const draft = newMap.get(currentSupplierId);
                          if (draft) {
                            newMap.set(currentSupplierId, {
                              ...draft,
                              editedDraft: e.target.value
                            });
                          }
                          return newMap;
                        });
                      }
                    }}
                    rows={12}
                    className="mt-2"
                    placeholder="Edit your response here..."
                  />
                </div>
                
                <Alert>
                  <AlertDescription>
                    Review the response carefully. You can save and come back to edit later, or send it now.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDraftModalOpen(false)}
                disabled={sendingResponse}
              >
                Save & Close
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (currentSupplierId && currentDraft) {
                    setSupplierDrafts(prev => {
                      const newMap = new Map(prev);
                      newMap.set(currentSupplierId, {
                        ...currentDraft,
                        editedDraft: currentDraft.draft
                      });
                      return newMap;
                    });
                  }
                }}
                disabled={sendingResponse}
              >
                Reset to Draft
              </Button>
              <Button
                onClick={sendEditedResponse}
                disabled={sendingResponse || !currentDraft?.editedDraft.trim()}
              >
                {sendingResponse ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Response'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}