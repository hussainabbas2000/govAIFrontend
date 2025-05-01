
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { useEffect, useState } from 'react';

// Dummy data structure - replace with actual data fetching and AI results
interface RecommendedOpportunity {
  id: string;
  title: string;
  agency: string;
  relevanceScore: number; // Example score from AI
  link: string;
  closingDate: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching recommendations (replace with actual AI call)
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Placeholder: In a real app, this would involve:
        // 1. Fetching user preferences (e.g., from localStorage or backend)
        // 2. Fetching potential opportunities (e.g., from SAM.gov, SEPTA)
        // 3. Sending opportunities and preferences to an AI service for ranking
        // 4. Receiving ranked recommendations

        // Dummy data for now
        const dummyRecommendations: RecommendedOpportunity[] = [
          { id: 'rec1', title: 'AI-Powered Data Analysis Platform', agency: 'Dept. of Energy', relevanceScore: 0.95, link: '#', closingDate: '2024-09-15' },
          { id: 'rec2', title: 'Cybersecurity Training Services', agency: 'DHS', relevanceScore: 0.92, link: '#', closingDate: '2024-08-30' },
          { id: 'rec3', title: 'Cloud Migration Support (GovCloud)', agency: 'GSA', relevanceScore: 0.88, link: '#', closingDate: '2024-10-01' },
          { id: 'rec4', title: 'Sustainable Office Supplies', agency: 'EPA', relevanceScore: 0.85, link: '#', closingDate: '2024-09-05' },
          { id: 'rec5', title: 'Logistics & Transportation Optimization', agency: 'DoT', relevanceScore: 0.81, link: '#', closingDate: '2024-09-20' },
          // Add more dummy data up to 50 if needed
        ];
        setRecommendations(dummyRecommendations.slice(0, 50)); // Limit to 50

      } catch (err) {
        setError('Failed to load recommendations. Please try again later.');
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Opportunities</CardTitle>
          <CardDescription>
            Top 50 opportunities ranked based on your preferences and AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 border-b pb-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead className="text-right">Closing Date</TableHead>
                  <TableHead className="text-right">Relevance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">{rec.title}</TableCell>
                    <TableCell>{rec.agency}</TableCell>
                    <TableCell className="text-right">{rec.closingDate}</TableCell>
                    <TableCell className="text-right">{(rec.relevanceScore * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <a href={rec.link} target="_blank" rel="noopener noreferrer">View</a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">
              No recommendations found based on your current preferences, or still processing.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
