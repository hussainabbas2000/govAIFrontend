"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import type { OngoingBid } from "@/app/page";

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !id) return;

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

      {submissionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submissionError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-4 mt-8">
        <Button
          variant="outline"
          onClick={handleStartBiddingProcess}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Start Bidding Process"}
        </Button>
        <Button onClick={handleProceedToQuoteRequest} disabled={isSubmitting}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Proceed to Quote Request
        </Button>
      </div>
    </main>
  );
}
