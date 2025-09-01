'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { rankOpportunities } from '@/ai/flows/rank-opportunities';
import { useEffect, useState } from 'react';
import { getPreferences, UserPreferences } from '@/lib/supabase/preferences';

interface RecommendedOpportunity {
  id: string;
  title: string;
  agency: string;
  relevanceScore: number;
  link: string;
  closingDate: string;
  description?: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch user preferences from Supabase
        let prefs: UserPreferences | null = null;

        try {
          prefs = await getPreferences();
          setUserPreferences(prefs);
        } catch (prefErr: any) {
          console.warn('No preferences found or failed to fetch:', prefErr.message);
          setUserPreferences(null);
        }

         // 2. Fetch opportunities from backend API
        // const res = await fetch('/api/sam-gov');
        // if (!res.ok) throw new Error(`API error: ${res.status}`);
        // const opportunities = await res.json();

        // // 3. Map backend → frontend format
        // let fetchedOpportunities: RecommendedOpportunity[] = opportunities.slice(0, 4).map((opp: any) => ({
        //   id: opp.id,
        //   title: opp.title,
        //   agency: opp.department || opp.subtier || 'Unknown',
        //   relevanceScore: 0,
        //   link: opp.link,
        //   closingDate: opp.closingDate,
        //   description: typeof opp.description === 'string' ? opp.description : '',
        // }));
        let fetchedOpportunities: RecommendedOpportunity[] = [
          { id: 'rec1', title: 'AI-Powered Data Analysis Platform', agency: 'Dept. of Energy', relevanceScore: 0, link: '#', closingDate: '2024-09-15', description: 'Develop a platform using AI for energy data analysis.' },
          { id: 'rec2', title: 'Cybersecurity Training Services', agency: 'DHS', relevanceScore: 0, link: '#', closingDate: '2024-08-30', description: 'Provide cybersecurity training for government employees.' },
          { id: 'rec3', title: 'Cloud Migration Support (GovCloud)', agency: 'GSA', relevanceScore: 0, link: '#', closingDate: '2024-10-01', description: 'Assist agencies in migrating services to GovCloud.' },
          { id: 'rec4', title: 'Sustainable Office Supplies', agency: 'EPA', relevanceScore: 0, link: '#', closingDate: '2024-09-05', description: 'Supply eco-friendly office products.' },
          { id: 'rec5', title: 'Logistics & Transportation Optimization', agency: 'DOT', relevanceScore: 0, link: '#', closingDate: '2024-09-20', description: 'Optimize transportation routes and logistics for efficiency.' },
          { id: 'rec6', title: 'Janitorial Services - Federal Building', agency: 'GSA', relevanceScore: 0, link: '#', closingDate: '2024-10-10', description: 'Provide janitorial services for a federal building in Philadelphia, PA.' },
          { id: 'rec7', title: 'IT Hardware Refresh', agency: 'Department of Defense', relevanceScore: 0, link: '#', closingDate: '2024-11-01', description: 'Supply new laptops and desktops according to specified requirements.' },
        ];
        // 4. Rank with AI if preferences exist
        if (prefs) {
          console.log('Ranking with preferences:', prefs);
          const rankingPromises = fetchedOpportunities.map(async (opp) => {
            try {
              const result = await rankOpportunities({
                opportunityDescription: opp.description || opp.title,
                userPreferences: prefs,
              });
              return { ...opp, relevanceScore: result.relevanceScore };
            } catch (aiError: any) {
              console.error(`AI ranking failed for opportunity ${opp.id}:`, aiError);
              return { ...opp, relevanceScore: 0 };
            }
          });
          fetchedOpportunities = await Promise.all(rankingPromises);
          fetchedOpportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
        } else {
          console.log('No preferences found, skipping AI ranking.');
        }

        // 5. Save top results
        setRecommendations(fetchedOpportunities.slice(0, 50));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations. Please try again later.');
        setRecommendations([]);
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
            Top opportunities ranked based on your preferences and AI analysis.
            {!userPreferences && ' (No preferences set. Showing default listings.)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
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
                        <a href={rec.link} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No recommendations found matching your preferences, or still processing.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
