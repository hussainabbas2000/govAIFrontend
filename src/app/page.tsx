

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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TotalListingsLabel } from '@/components/total-listings-label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Building, FileText, LifeBuoy, Link as LinkIcon, Megaphone, Settings, TrendingUp, FilePlus, Database, Receipt, BookTemplate, Globe, DollarSign, Percent, Send, Trophy, Layers, CheckCircle, BellRing, Clock, FileCheck, SearchCode, CreditCard, CircleDollarSign, Lightbulb } from 'lucide-react'; // Added necessary icons
import { BidsByCategoryChart } from '@/components/dashboard/bids-by-category-chart';
import { BidsByPortalChart } from '@/components/dashboard/bids-by-portal-chart'; // Import the new chart component

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [septaListingsCount, setSeptaListingsCount] = useState<number | null>(null);

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


  useEffect(() => {
    //  const fetchSeptaOpportunities = async () => {
    //    try {
    //      const response = await fetch('/api/run-python-script');
    //      if (!response.ok) {
    //        console.error(`HTTP error! status: ${response.status}`);
    //        try {
    //          const errorData = await response.json();
    //          setError(`Failed to fetch SEPTA opportunities: HTTP ${response.status} - ${errorData.error}`);
    //        } catch (e) {
    //          setError(`Failed to fetch SEPTA opportunities: HTTP ${response.status} - ${response.statusText}`);
    //        }
    //        setSeptaListingsCount(0); // Set count to 0 or handle error state appropriately
    //        return;
    //      }
    //       // Assuming the python script updates the JSON file which is then imported
    //       // Fetch the count from the potentially updated JSON data
    //       // Note: This approach might lead to stale data if the script fails or runs async
    //       // A better approach would be to have the API route return the count or data directly.
    //      const septaResponse = await fetch('/api/septa'); // Assuming this endpoint reads the JSON
    //      if(septaResponse.ok){
    //         const data = await septaResponse.json();
    //         setSeptaListingsCount(Array.isArray(data) ? data.length : 0);
    //      } else {
            setSeptaListingsCount(10);
    //         console.error("Could not fetch SEPTA data after script run");
    //      }

    //    } catch (err: any) {
    //      console.error('Error fetching SEPTA opportunities:', err);
    //      setError(err.message || 'An unexpected error occurred while fetching SEPTA opportunities.');
    //      setSeptaListingsCount(0);
    //    }
    //  };

    // fetchSeptaOpportunities();
  }, []);


  const navigateTo = (path: string) => {
    router.push(path);
  };

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
                <SidebarMenuButton onClick={() => { /* Navigate to Recommendations */ }}>
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
          <main className="flex-1 p-6 bg-white"> {/* Changed to white */}
            {error && <div className="mb-4 rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {/* Use grid with 4 columns on large screens */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* Section 1: Portals */}
              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* SAM.gov Card */}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium text-primary">SAM.gov</CardTitle>
                   <Building className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Federal contracting opportunities.</CardDescription>
                  <div className="mt-4 flex items-center justify-between">
                     {/* Placeholder total, update with actual data */}
                     <TotalListingsLabel total={100} loading={false} />
                    <Button onClick={() => navigateTo('/sam-gov')} size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">View</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* SEPTA Card */}
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
              <Card className="lg:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Action Items Card */}
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

               <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Ongoing Bids Table */}
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
                       {/* Placeholder Rows - Replace with actual data */}
                       <TableRow>
                         <TableCell className="font-medium">IT Support Services</TableCell>
                         <TableCell>Dept. of Commerce</TableCell>
                         <TableCell><span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Drafting</span></TableCell>
                         <TableCell className="text-right">2024-08-15</TableCell>
                       </TableRow>
                       <TableRow>
                         <TableCell className="font-medium">Office Supplies RFQ</TableCell>
                         <TableCell>GSA</TableCell>
                          <TableCell><span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Submitted</span></TableCell>
                         <TableCell className="text-right">2024-07-30</TableCell>
                       </TableRow>
                        <TableRow>
                         <TableCell className="font-medium">Construction Project X</TableCell>
                         <TableCell>SEPTA</TableCell>
                          <TableCell><span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Clarification</span></TableCell>
                         <TableCell className="text-right">2024-09-01</TableCell>
                       </TableRow>
                       {/* Add more rows as needed */}
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground italic">No ongoing bids</TableCell>
                        </TableRow>
                     </TableBody>
                   </Table>
                   <Button variant="outline" size="sm" className="mt-4 w-full">View All Ongoing Bids</Button>
                 </CardContent>
               </Card>

              {/* Section 3: Payments Summary & Performance Overview */}
               <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Payments Summary Card */}
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

              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Performance Overview */}
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
              <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Bids by Category Chart Card */}
                <CardHeader>
                  <CardTitle>Bids by Category</CardTitle>
                  <CardDescription>Distribution of bids across different categories.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BidsByCategoryChart />
                </CardContent>
              </Card>

               <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Bids by Portal Chart Card */}
                  <BidsByPortalChart />
               </Card>

                {/* Section 5: Quick Links & Recommendations */}
                <Card className="lg:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Quick Links Card */}
                   <CardHeader>
                       <CardTitle>Quick Links</CardTitle>
                   </CardHeader>
                   <CardContent className="grid grid-cols-1 gap-4">
                        {/* Updated Links with Icons */}
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

               <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Recommendations Card */}
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
                     <Button variant="outline" size="sm" className="mt-4 w-full">View All Recommendations</Button>
                  </CardContent>
               </Card>

            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-background px-6 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} GovContract Navigator. All rights reserved.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
