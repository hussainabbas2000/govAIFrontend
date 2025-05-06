
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { rankOpportunities } from '@/ai/flows/rank-opportunities';
import { useEffect, useState } from 'react';

// Dummy data structure - replace with actual data fetching and AI results
interface RecommendedOpportunity {
  id: string;
  title: string;
  agency: string;
  relevanceScore: number; // Example score from AI
  link: string;
  closingDate: string;
  description?: string; // Add optional description field
}

// Define type for user preferences matching localStorage structure
interface UserPreferences {
  opportunityType: 'product' | 'service' | 'product/service' | '';
  location: string;
  interestedDepartments: string;
}


export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // Track client-side mount

  useEffect(() => {
    setIsClient(true); // Component has mounted on the client
  }, []);

  useEffect(() => {
    if (!isClient) return; // Only run fetch logic on the client

    // Simulate fetching recommendations (replace with actual AI call)
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      let userPreferences: UserPreferences | null = null;

      try {
        // 1. Fetch user preferences (e.g., from localStorage or backend)
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          try {
            userPreferences = JSON.parse(savedPreferences);
          } catch (parseError) {
            console.error('Failed to parse saved preferences:', parseError);
            setError('Could not load your preferences. Using default ranking.');
            // Optionally clear invalid preferences
            // localStorage.removeItem('userPreferences');
          }
        } else {
           console.warn('No user preferences found in localStorage. Using default ranking.');
           // Proceed without preferences, AI might handle this or assign default scores
        }


        // 2. Fetch potential opportunities (e.g., from SAM.gov, SEPTA)
        // Using dummy data for now
        let fetchedOpportunities: RecommendedOpportunity[] = [
           { id: 'rec1', title: 'AI-Powered Data Analysis Platform', agency: 'Dept. of Energy', relevanceScore: 0, link: '#', closingDate: '2024-09-15', description: 'Develop a platform using AI for energy data analysis.' },
           { id: 'rec2', title: 'Cybersecurity Training Services', agency: 'DHS', relevanceScore: 0, link: '#', closingDate: '2024-08-30', description: 'Provide cybersecurity training for government employees.' },
           { id: 'rec3', title: 'Cloud Migration Support (GovCloud)', agency: 'GSA', relevanceScore: 0, link: '#', closingDate: '2024-10-01', description: 'Assist agencies in migrating services to GovCloud.' },
           { id: 'rec4', title: 'Sustainable Office Supplies', agency: 'EPA', relevanceScore: 0, link: '#', closingDate: '2024-09-05', description: 'Supply eco-friendly office products.' },
           { id: 'rec5', title: 'Logistics & Transportation Optimization', agency: 'DOT', relevanceScore: 0, link: '#', closingDate: '2024-09-20', description: 'Optimize transportation routes and logistics for efficiency.' },
           // Add more dummy data...
           { id: 'rec6', title: 'Janitorial Services - Federal Building', agency: 'GSA', relevanceScore: 0, link: '#', closingDate: '2024-10-10', description: 'Provide janitorial services for a federal building in Philadelphia, PA.' },
           { id: 'rec7', title: 'IT Hardware Refresh', agency: 'Department of Defense', relevanceScore: 0, link: '#', closingDate: '2024-11-01', description: 'Supply new laptops and desktops according to specified requirements.' },
        ];


        // 3. Send opportunities and preferences to an AI service for ranking
        if (userPreferences) {
          console.log("Ranking with preferences:", userPreferences);
          const rankingPromises = fetchedOpportunities.map(async (opp) => {
            try {
              const result = await rankOpportunities({
                // Use description if available, otherwise fall back to title
                opportunityDescription: opp.description || opp.title,
                userPreferences: userPreferences!, // We checked userPreferences is not null
              });
              return { ...opp, relevanceScore: result.relevanceScore };
            } catch (aiError: any) {
              console.error(`AI ranking failed for opportunity ${opp.id}:`, aiError);
              // Assign a low score or handle error as appropriate
              return { ...opp, relevanceScore: 0 };
            }
          });
          fetchedOpportunities = await Promise.all(rankingPromises);

           // 4. Sort by relevance score (descending)
           fetchedOpportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);

        } else {
          console.log("No preferences found, skipping AI ranking.");
           // Optionally assign default scores or keep them as 0 if no preferences
        }


        // 5. Update state with ranked recommendations
        setRecommendations(fetchedOpportunities.slice(0, 50)); // Limit to 50

      } catch (err) {
        setError('Failed to load recommendations. Please try again later.');
        console.error("Error fetching recommendations:", err);
        setRecommendations([]); // Clear recommendations on error
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [isClient]); // Rerun when isClient becomes true

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Opportunities</CardTitle>
          <CardDescription>
            Top opportunities ranked based on your preferences and AI analysis.
             {!isClient && " (Loading preferences...)"}
             {isClient && !localStorage.getItem('userPreferences') && " (No preferences set. Showing default listings.)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
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
            <p className="text-center text-muted-foreground py-6">
              {isClient ? "No recommendations found matching your preferences, or still processing." : "Loading recommendations..."}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

