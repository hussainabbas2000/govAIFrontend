"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { SamGovOpportunity } from "@/types/sam-gov";
import { fetchAnalyzedContractSummary } from "@/ai/flows/summarize-contract-opportunity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loading from "@/app/loading";
import { parseDescriptionWithGemini } from "@/ai/flows/summarize-contract-opportunity"; // or wherever you place it
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ClipboardList,
  FileText,
  ShoppingCart,
  Terminal,
  AlertCircle,
  Send,
  MessageCircle,
  Bot,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { OngoingBid } from "@/app/page";

type ChatMessage = { role: "agent" | "user"; content: string };

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderContent(value: any): React.ReactNode {
  if (typeof value === "string" || typeof value === "number") {
    return <p>{value}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside ml-6">
        {value.map((item, i) => (
          <li key={i}>{renderContent(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="space-y-2">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <p className="font-semibold">{formatKey(k)}:</p>
            <div className="ml-4">{renderContent(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <p>{String(value)}</p>;
}

export default function BidSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "agent", content: "How may I help you? What questions do you have about this contract?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [totalContext, setTotalContext] = useState<{ summary: any; chatHistory: ChatMessage[] } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize totalContext when summary is loaded
  useEffect(() => {
    if (summary) {
      setTotalContext({ summary, chatHistory: chatMessages });
    }
  }, [summary]);

  useEffect(() => {
    if (!isClient || !id) return;
    let savedData = localStorage.getItem(`summary-${id}`)
    if(savedData !== null){
      const x = JSON.parse(savedData)
      if (x){
      setSummary(x)
      setLoading(false)
      return;
      }
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/sam-gov?id=${id}`);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to fetch opportunity.");
        }
        const opportunities: SamGovOpportunity[] = await response.json();
        const opportunity = opportunities.find((op) => op.id === id);
        if (!opportunity) throw new Error("Opportunity not found.");

        if (opportunity.resourceLinks.length == 0) {
          const api_key = process.env.NEXT_PUBLIC_SAM_GOV_API_KEY;
          const res = await fetch(
            `${opportunity.description}&api_key=${api_key}`
          );

          const desc = await res.json();
          const descsummary = await parseDescriptionWithGemini(desc);
          if (descsummary){
            setSummary({
              ...descsummary,
              title: opportunity.title,
              id: opportunity.id,
              agency: opportunity.department || "N/A",
              originalOpportunityLink: opportunity.link,
              originalClosingDate: opportunity.closingDate,
            });
            const finalSummary = {
              ...descsummary,
              title: opportunity.title,
              id: opportunity.id,
              agency: opportunity.department || "N/A",
              originalOpportunityLink: opportunity.link,
              originalClosingDate: opportunity.closingDate,
            }
            sessionStorage.setItem(id,JSON.stringify(finalSummary))
            let savedData = localStorage.getItem(`summary-${id}`)
            if(!savedData){
              localStorage.setItem(`summary-${id}`,JSON.stringify(finalSummary))
            }
          } else{
            throw new Error("Failed to generate AI Summary.")
          }
        } else {
          const aiSummary = await fetchAnalyzedContractSummary(
            opportunity.resourceLinks
          );
          if (aiSummary) {
            setSummary({
              ...aiSummary,
              title: opportunity.title,
              id: opportunity.id,
              agency: opportunity.department || "N/A",
              originalOpportunityLink: opportunity.link,
              originalClosingDate: opportunity.closingDate,
            });
            const finalSummary = {
              ...aiSummary,
              title: opportunity.title,
              id: opportunity.id,
              agency: opportunity.department || "N/A",
              originalOpportunityLink: opportunity.link,
              originalClosingDate: opportunity.closingDate,
            }
            let savedData = localStorage.getItem(`summary-${id}`)
            if(!savedData){
              localStorage.setItem(`summary-${id}`,JSON.stringify(finalSummary))
            }
          } else {
            throw new Error("Failed to generate AI summary.");
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isClient]);

  const handleStartBiddingProcess = () => {
    if (!summary || !isClient) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const existingBidsString = localStorage.getItem("ongoingBids");
      let existingBids: OngoingBid[] = [];
      if (existingBidsString) {
        try {
          existingBids = JSON.parse(existingBidsString);
          if (!Array.isArray(existingBids)) existingBids = [];
        } catch {
          localStorage.removeItem("ongoingBids");
        }
      }

      const bidIndex = existingBids.findIndex((b) => b.id === id);
      if (bidIndex !== -1) {
        existingBids[bidIndex].status = "Drafting";
      } else {
        existingBids.push({
          id: summary.id,
          title: summary.title,
          agency: summary.agency,
          status: "Drafting",
          deadline: summary.originalClosingDate || "N/A",
          source: "SAM.gov",
          linkToOpportunity:
            summary.originalOpportunityLink || `/sam-gov/${summary.id}`,
        });
      }

      localStorage.setItem("ongoingBids", JSON.stringify(existingBids));
    } catch (err: any) {
      console.error(err);
      setSubmissionError(err.message || "Failed to start bid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToQuoteRequest = () => {
    handleStartBiddingProcess();

    const existingBidsString = localStorage.getItem("ongoingBids");
    let existingBids: OngoingBid[] = [];
    if (existingBidsString) {
      try {
        existingBids = JSON.parse(existingBidsString);
      } catch {
        localStorage.removeItem("ongoingBids");
      }
    }
    const bidIndex = existingBids.findIndex((b) => b.id === summary.id);
    if (bidIndex !== -1) {
      existingBids[bidIndex].status = "RFQs Sent";
    } else {
      existingBids.push({
        id: summary.id,
        title: summary.title,
        agency: summary.agency,
        status: "RFQs Sent",
        deadline: summary.originalClosingDate || "N/A",
        source: "SAM.gov",
        linkToOpportunity:
          summary.originalOpportunityLink || `/sam-gov/${summary.id}`,
      });
    }

    
    localStorage.setItem("ongoingBids", JSON.stringify(existingBids));
    localStorage.setItem("summary", JSON.stringify(summary));
    router.push(`/rfq/${summary.id}`);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsSendingMessage(true);

    // Update totalContext with user message
    setTotalContext({ summary, chatHistory: updatedMessages });

    try {
      // Combine summary with chat history for context
      const contextPayload = {
        summary: summary,
        chatHistory: updatedMessages,
        userMessage: userMessage.content,
      };

      const response = await fetch("http://localhost:9000/message-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from assistant");
      }

      const data = await response.json();
      const agentMessage: ChatMessage = { role: "agent", content: data.message };
      const messagesWithAgent = [...updatedMessages, agentMessage];
      setChatMessages(messagesWithAgent);
      
      // Update totalContext with agent response
      setTotalContext({ summary, chatHistory: messagesWithAgent });
    } catch (err: any) {
      console.error("Chat error:", err);
      // Add error message as agent response
      const errorMessage: ChatMessage = { role: "agent", content: "Sorry, I encountered an error. Please try again." };
      const messagesWithError = [...updatedMessages, errorMessage];
      setChatMessages(messagesWithError);
      
      // Update totalContext with error message
      setTotalContext({ summary, chatHistory: messagesWithError });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="w-full max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            onClick={() => router.back()}
            variant="secondary"
            className="mt-4"
          >
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
        <Button
          onClick={() => router.back()}
          variant="secondary"
          className="mt-4"
        >
          Go Back
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-8 max-w-5xl animate-fadeIn">
      <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
        <FileText className="text-primary" /> Contract Bid Summary
      </h1>

      {Object.entries(summary).map(([key, value]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="text-primary" />
              {formatKey(key)}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderContent(value)}</CardContent>
        </Card>
      ))}

      {/* Chat Interface */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="text-primary h-5 w-5" />
            Contract Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Container */}
          <div className="h-100 overflow-y-auto rounded-lg bg-muted/30 p-4 space-y-4 border">
            {chatMessages.map((msg: ChatMessage, index: number) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.role === "agent"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.role === "agent" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "agent"
                      ? "bg-card border shadow-sm"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isSendingMessage && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-card border shadow-sm rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question about this contract..."
              disabled={isSendingMessage}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isSendingMessage}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button asChild size="lg">
        <Link href={`/sam-gov/${id}/quotenegotiation`}>
          Quote Negotiation
        </Link>
      </Button>

      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-4 mt-8">
        {/* <Button
          variant="outline"
          onClick={handleStartBiddingProcess}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Start Bidding Process"}
        </Button> */}

        {/* SHOULD UNCOMMENT LATER */}
        {/* <Button onClick={handleProceedToQuoteRequest} disabled={isSubmitting}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Proceed to Quote Request
        </Button> */}
      </div>
    </main>
  );
}
