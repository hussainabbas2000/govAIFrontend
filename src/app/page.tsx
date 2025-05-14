
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { useRouter, usePathname } from 'next/navigation'; 
import { useEffect, useState } from 'react';
import { TotalListingsLabel } from '@/components/total-listings-label'; 
import type { SamGovOpportunity } from '@/types/sam-gov'; // Updated import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Building, FileText, LifeBuoy, Link as LinkIcon, Megaphone, Settings, TrendingUp, FilePlus, Database, Receipt, BookTemplate, Globe, DollarSign, Percent, Send, Trophy, Layers, CheckCircle, BellRing, Clock, FileCheck, SearchCode, CreditCard, CircleDollarSign, Lightbulb, Mail, UserCog, CircleDot, SendHorizonal, Check, PackageCheck, Handshake, ListChecks, FileClock } from 'lucide-react'; 
import { BidsByCategoryChart } from '@/components/dashboard/bids-by-category-chart';
import { BidsByPortalChart } from '@/components/dashboard/bids-by-portal-chart'; 
import { useToast } from '@/hooks/use-toast'; 
import { Badge } from "@/components/ui/badge"; 
import { cn } from '@/lib/utils'; 

// Define bid states type
export type BidStatus = "Drafting" | "RFQs Sent" | "Quotes Received" | "Final Quotes Selected" | "Bid Submitted" | "Bid Approved" | "Bid Completed" | "Clarification";

// Define structure for ongoing bids
export interface OngoingBid {
  id: string; 
  title: string;
  agency: string;
  status: BidStatus;
  deadline: string; 
  source: 'SAM.gov' | 'SEPTA'; 
  linkToOpportunity?: string; 
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [error, setError] = useState<string | null>(null);
  const [septaListingsCount, setSeptaListingsCount] = useState<number | null>(0); // Default to 0
  const [samListingsCount, setSamListingsCount] = useState<number | null>(null);
  const { toast } = useToast(); 
  const [isClient, setIsClient] = useState(false);

   // Dummy data for Action Items - replace with actual data fetching later
   const [actionItems, setActionItems] = useState({
     bidsDueToday: 3,
     pendingInvoices: 5,
     bidsToApprove: 2,
     newBidsFound: 8,
   });

   // Dummy data for Payments Summary
   const [paymentSummary, setPaymentSummary] = useState({
     outstanding: 12500.00,
     netProfit: 5800.75,
     paidInvoices: 42,
   });

   // Dummy data for Recommendations - structured for table
   const [recommendations, setRecommendations] = useState([
       { title: "IT Support Services", agency: "Dept. of Commerce", deadline: "2024-08-20" },
       { title: "Janitorial Supplies", agency: "GSA", deadline: "2024-09-05" },
       { title: "Fleet Vehicle Maintenance", agency: "SEPTA", deadline: "2024-08-30" },
   ]);

   const [ongoingBids, setOngoingBids] = useState<OngoingBid[]>([]);

  useEffect(() => {
    setIsClient(true); 
  }, []);


  useEffect(() => {
    if (isClient) {
      // Fetch SEPTA listings count
      const fetchSeptaData = async () => {
        try {
          const scriptResponse = await fetch('/api/run-python-script');
          if (!scriptResponse.ok) {
            console.error(`Python script execution failed: HTTP ${scriptResponse.status}`);
            try {
              const errorData = await scriptResponse.json();
              setError(`Python script failed: HTTP ${scriptResponse.status} - ${errorData.error}`);
            } catch (e) {
              setError(`Python script failed: HTTP ${scriptResponse.status} - ${scriptResponse.statusText}`);
            }
            setSeptaListingsCount(0);
            return;
          }
           // If script runs, assume septa_open_quotes.json is updated.
           // Then fetch from the local JSON file via API.
          const septaResponse = await fetch('/api/septa-listings');
          if (septaResponse.ok) {
            const data = await septaResponse.json();
            setSeptaListingsCount(Array.isArray(data) ? data.length : 0);
          } else {
            console.error("Could not fetch SEPTA listings count");
            setError(`Failed to fetch SEPTA listings count: HTTP ${septaResponse.status}`);
            setSeptaListingsCount(0);
          }
        } catch (err: any) {
          console.error('Error processing SEPTA data:', err);
          setError(err.message || 'An unexpected error occurred while processing SEPTA data.');
          setSeptaListingsCount(0);
        }
      };
      fetchSeptaData();

      // Fetch SAM.gov listings count
      const fetchSamGovCount = async () => {
        try {
          const response = await fetch('/api/sam-gov'); // Fetch from your API route
          if (!response.ok) {
            console.error("Could not fetch SAM.gov listings count from API route");
            setSamListingsCount(0);
            return;
          }
          const data: SamGovOpportunity[] = await response.json();
          setSamListingsCount(data.length);
        } catch (e) {
          console.error("Error fetching SAM.gov count from API route:", e);
          setSamListingsCount(0);
        }
      };
      fetchSamGovCount();


      // Load ongoing bids from localStorage
      console.log("Home page useEffect triggered, re-fetching ongoing bids from localStorage.");
      const storedBids = localStorage.getItem('ongoingBids');
      if (storedBids) {
        try {
          const parsedBids = JSON.parse(storedBids);
          setOngoingBids(parsedBids);
          console.log("Loaded ongoing bids:", parsedBids);
        } catch (e) {
          console.error("Failed to parse ongoing bids from localStorage", e);
          localStorage.removeItem('ongoingBids'); 
          setOngoingBids([]); 
        }
      } else {
         setOngoingBids([]); 
         console.log("No ongoing bids found in localStorage.");
      }
    }
  }, [isClient, pathname]); 


  const navigateTo = (path: string) => {
    router.push(path);
  };

   // Helper function to get badge variant based on status
   const getStatusBadgeVariant = (status: BidStatus): "default" | "secondary" | "destructive" | "outline" => {
     switch (status) {
       case "Drafting":
         return "outline"; 
       case "RFQs Sent":
       case "Quotes Received":
       case "Final Quotes Selected":
       case "Bid Submitted":
         return "default"; 
       case "Clarification":
         return "secondary"; 
       case "Bid Approved":
       case "Bid Completed":
         return "default"; 
       default:
         return "outline";
     }
   };

   const getStatusBadgeClass = (status: BidStatus): string => {
      switch (status) {
         case "Drafting":
             return "bg-gray-100 text-gray-700 border-gray-300";
         case "RFQs Sent":
             return "bg-blue-100 text-blue-700 border-blue-300";
         case "Quotes Received":
             return "bg-indigo-100 text-indigo-700 border-indigo-300";
         case "Final Quotes Selected":
             return "bg-purple-100 text-purple-700 border-purple-300";
          case "Bid Submitted":
             return "bg-cyan-100 text-cyan-700 border-cyan-300";
         case "Clarification":
             return "bg-yellow-100 text-yellow-700 border-yellow-300";
         case "Bid Approved":
             return "bg-lime-100 text-lime-700 border-lime-300";
         case "Bid Completed":
             return "bg-green-100 text-green-700 border-green-300";
         default:
             return "bg-gray-100 text-gray-700 border-gray-300";
       }
   }

   // Helper function to get icon based on status
   const getStatusIcon = (status: BidStatus) => {
      switch (status) {
          case "Drafting": return <FileText className="mr-1 h-3 w-3" />;
          case "RFQs Sent": return <SendHorizonal className="mr-1 h-3 w-3" />;
          case "Quotes Received": return <PackageCheck className="mr-1 h-3 w-3" />;
          case "Final Quotes Selected": return <ListChecks className="mr-1 h-3 w-3" />;
          case "Bid Submitted": return <Send className="mr-1 h-3 w-3" />;
          case "Clarification": return <FileClock className="mr-1 h-3 w-3" />;
          case "Bid Approved": return <Handshake className="mr-1 h-3 w-3" />;
          case "Bid Completed": return <CheckCircle className="mr-1 h-3 w-3" />;
          default: return <CircleDot className="mr-1 h-3 w-3" />;
      }
   }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
             <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
               <Icons.logo className="h-6 w-auto" />
             </Button>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive onClick={() => navigateTo('/')}>
                  <Icons.home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigateTo('/sam-gov')}>
                   <Building className="h-4 w-4" />
                  <span>SAM.gov</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigateTo('/septa')}>
                   <Briefcase className="h-4 w-4" />
                  <span>SEPTA</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { /* Navigate to Bids page */ }}>
                  <FileText className="h-4 w-4" />
                  <span>Ongoing Bids</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigateTo('/recommendations')}>
                  <TrendingUp className="h-4 w-4" />
                  <span>Recommendations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { /* Navigate to Quick Links */ }}>
                  <LinkIcon className="h-4 w-4" />
                  <span>Quick Links</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter className="mt-auto">
             <SidebarMenu>
                <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => navigateTo('/preferences')}>
                   <UserCog className="h-4 w-4" />
                   <span>Preferences</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => { /* Navigate to Settings */ }}>
                   <Settings className="h-4 w-4" />
                   <span>Settings</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => { /* Navigate to Help */ }}>
                   <LifeBuoy className="h-4 w-4" />
                   <span>Help</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             </SidebarMenu>
           </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          {/* Navbar */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
            <h1 className="text-xl font-semibold">GovContract Navigator</h1>
             {/* Add User Profile/Notifications here later */}
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Megaphone className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <Button variant="ghost" size="icon">
                    <Icons.user className="h-5 w-5" />
                    <span className="sr-only">User Profile</span>
                </Button>
             </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-white"> 
            {error && <div className="mb-4 rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {/* Use grid with 4 columns on large screens */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* Section 1: Portals */}
              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium text-primary">SAM.gov</CardTitle>
                   <Building className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Federal contracting opportunities.</CardDescription>
                  <div className="mt-4 flex items-center justify-between">
                     <TotalListingsLabel total={samListingsCount} loading={samListingsCount === null} />
                    <Button onClick={() => navigateTo('/sam-gov')} size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">View</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium text-primary">SEPTA</CardTitle>
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Local transit authority opportunities.</CardDescription>
                   <div className="mt-4 flex items-center justify-between">
                     <TotalListingsLabel total={septaListingsCount} loading={septaListingsCount === null} />
                    <Button onClick={() => navigateTo('/septa')} size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">View</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Action Items & Ongoing Bids */}
              <Card className="lg:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium text-primary">Action Items</CardTitle>
                  <BellRing className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="grid gap-3">
                  {actionItems.bidsDueToday > 0 && (
                    <div className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-destructive" />
                        <p className="font-medium">Bids due today</p>
                      </div>
                      <span className="font-semibold text-destructive">{actionItems.bidsDueToday}</span>
                    </div>
                  )}
                  {actionItems.pendingInvoices > 0 && (
                    <div className="flex items-center justify-between text-sm border-b pb-2">
                       <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-yellow-600" />
                        <p className="font-medium">Pending Invoices</p>
                       </div>
                      <span className="font-semibold text-yellow-600">{actionItems.pendingInvoices}</span>
                    </div>
                  )}
                  {actionItems.bidsToApprove > 0 && (
                    <div className="flex items-center justify-between text-sm border-b pb-2">
                       <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-blue-600" />
                        <p className="font-medium">Bids to approve</p>
                       </div>
                      <span className="font-semibold text-blue-600">{actionItems.bidsToApprove}</span>
                    </div>
                  )}
                  {actionItems.newBidsFound > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                       <SearchCode className="h-4 w-4 text-green-600" />
                       <p className="font-medium">New bids found</p>
                      </div>
                      <span className="font-semibold text-green-600">{actionItems.newBidsFound}</span>
                    </div>
                  )}
                   {actionItems.bidsDueToday === 0 && actionItems.pendingInvoices === 0 && actionItems.bidsToApprove === 0 && actionItems.newBidsFound === 0 && (
                    <p className="text-sm text-muted-foreground italic">No pending action items.</p>
                  )}
                </CardContent>
              </Card>

               <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                 <CardHeader>
                   <CardTitle>Ongoing Bids</CardTitle>
                   <CardDescription>Your current bidding activities.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Title</TableHead>
                         <TableHead>Agency</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead className="text-right">Deadline</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {ongoingBids.length > 0 ? (
                          ongoingBids.map((bid) => (
                             <TableRow key={bid.id}>
                               <TableCell className="font-medium">{bid.title}</TableCell>
                               <TableCell>{bid.agency}</TableCell>
                               <TableCell>
                                 <Badge
                                    variant={getStatusBadgeVariant(bid.status)}
                                    className={cn("text-xs font-medium", getStatusBadgeClass(bid.status))}
                                  >
                                    {getStatusIcon(bid.status)}
                                    {bid.status}
                                  </Badge>
                               </TableCell>
                               <TableCell className="text-right">{bid.deadline}</TableCell>
                             </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground italic">No ongoing bids</TableCell>
                          </TableRow>
                       )}
                     </TableBody>
                   </Table>
                   <Button variant="outline" size="sm" className="mt-4 w-full">View All Ongoing Bids</Button>
                 </CardContent>
               </Card>

              {/* Section 3: Payments Summary & Performance Overview */}
               <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                 <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <CardTitle className="text-lg font-medium text-primary">Payments Summary</CardTitle>
                   <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                 </CardHeader>
                 <CardContent className="grid gap-3">
                   <div className="flex items-center justify-between text-sm border-b pb-2">
                     <div className="flex items-center gap-2">
                       <CreditCard className="h-4 w-4 text-orange-500" />
                       <p className="font-medium">Outstanding</p>
                     </div>
                     <span className="font-semibold text-orange-500">${paymentSummary.outstanding.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm border-b pb-2">
                     <div className="flex items-center gap-2">
                       <TrendingUp className="h-4 w-4 text-green-600" />
                       <p className="font-medium">Net Profit</p>
                     </div>
                     <span className="font-semibold text-green-600">${paymentSummary.netProfit.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2">
                       <CheckCircle className="h-4 w-4 text-blue-600" />
                       <p className="font-medium">Paid Invoices</p>
                     </div>
                     <span className="font-semibold text-blue-600">{paymentSummary.paidInvoices}</span>
                   </div>
                 </CardContent>
               </Card>

              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                <CardHeader>
                  <CardTitle>Performance Overview (Weekly)</CardTitle>
                  <CardDescription>Key metrics for the past week.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Metric Card: Revenue */}
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <DollarSign className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue from Bids</p>
                      <p className="text-xl font-semibold">$15,231.89</p>
                    </div>
                  </div>
                  {/* Metric Card: Average Profit */}
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Percent className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Profit</p>
                      <p className="text-xl font-semibold">23.5%</p>
                    </div>
                  </div>
                  {/* Metric Card: Submitted Bid Value */}
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Send className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submitted Bid Value</p>
                      <p className="text-xl font-semibold">$65,890.50</p>
                    </div>
                  </div>
                  {/* Metric Card: Win Rate */}
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Trophy className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-xl font-semibold">65%</p>
                    </div>
                  </div>
                  {/* Metric Card: Total Bids Submitted */}
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <Layers className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Bids Submitted</p>
                      <p className="text-xl font-semibold">25</p>
                    </div>
                  </div>
                  {/* Metric Card: Bids Won */}
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bids Won</p>
                      <p className="text-xl font-semibold">16</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Charts */}
              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                <CardHeader>
                  <CardTitle>Bids by Category</CardTitle>
                  <CardDescription>Distribution of bids across different categories.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BidsByCategoryChart />
                </CardContent>
              </Card>

               <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                  <BidsByPortalChart />
               </Card>

                {/* Section 5: Quick Links & Recommendations */}
                <Card className="lg:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                   <CardHeader>
                       <CardTitle>Quick Links</CardTitle>
                   </CardHeader>
                   <CardContent className="grid grid-cols-1 gap-4">
                        
                       <Button variant="link" className="justify-start p-0 h-auto text-sm text-primary hover:underline">
                         <FilePlus className="mr-2 h-4 w-4" /> New bid entry form
                       </Button>
                       <Button variant="link" className="justify-start p-0 h-auto text-sm text-primary hover:underline">
                         <Database className="mr-2 h-4 w-4" /> Supplier database
                       </Button>
                       <Button variant="link" className="justify-start p-0 h-auto text-sm text-primary hover:underline">
                          <Receipt className="mr-2 h-4 w-4" /> Submit Invoice
                       </Button>
                       <Button variant="link" className="justify-start p-0 h-auto text-sm text-primary hover:underline">
                          <BookTemplate className="mr-2 h-4 w-4" /> Contract Templates
                       </Button>
                       <Button variant="link" className="justify-start p-0 h-auto text-sm text-primary hover:underline">
                         <Globe className="mr-2 h-4 w-4" /> Company Website
                       </Button>
                   </CardContent>
               </Card>

               <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-200 rounded-lg"> 
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium text-primary">Recommendations</CardTitle>
                    <Lightbulb className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                     {recommendations.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Agency</TableHead>
                              <TableHead className="text-right">Deadline</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recommendations.map((rec, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{rec.title}</TableCell>
                                <TableCell>{rec.agency}</TableCell>
                                <TableCell className="text-right">{rec.deadline}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm">View</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                     ) : (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No recommendations available.</p>
                     )}
                      <Button
                       variant="outline"
                       size="sm"
                       className="mt-4 w-full"
                       onClick={() => navigateTo('/recommendations')} 
                     >
                       View All Recommendations
                     </Button>
                  </CardContent>
               </Card>

            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-background px-6 py-4 text-center text-sm text-muted-foreground">
            <div className="flex justify-center items-center space-x-4">
              <span>© {new Date().getFullYear()} GovContract Navigator. All rights reserved.</span>
              <span className="text-muted-foreground">|</span>
              <Button variant="link" className="p-0 h-auto text-sm text-primary hover:underline" onClick={() => {/* Navigate to Contact Us */}}>
                 <Mail className="mr-1 h-4 w-4" /> Contact Us
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
