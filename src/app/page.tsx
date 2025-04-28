
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
import { Briefcase, Building, FileText, LifeBuoy, Link as LinkIcon, Megaphone, Settings, TrendingUp, FilePlus, Database, Receipt, BookTemplate, Globe } from 'lucide-react'; // Added necessary icons
import { BidsByCategoryChart } from '@/components/dashboard/bids-by-category-chart';
import { BidsByPortalChart } from '@/components/dashboard/bids-by-portal-chart'; // Import the new chart component

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [septaListingsCount, setSeptaListingsCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchSeptaOpportunities = async () => {
      try {
        const response = await fetch('/api/run-python-script');
        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          try {
            const errorData = await response.json();
            setError(`Failed to fetch SEPTA opportunities: HTTP ${response.status} - ${errorData.error || 'Unknown error'}`);
          } catch (jsonError) {
             setError(`Failed to fetch SEPTA opportunities: HTTP ${response.status} - Could not parse error response`);
          }
           setSeptaListingsCount(0); // Set count to 0 on error
          return;
        }
        // Assuming the script updates the JSON file, we fetch the data count from the file
        const dataResponse = await fetch('/api/septa'); // Use the endpoint that reads the JSON
         if (!dataResponse.ok) {
          console.error(`Failed to fetch SEPTA data count: HTTP ${dataResponse.status}`);
          setError(`Failed to fetch SEPTA data count: HTTP ${dataResponse.status}`);
          setSeptaListingsCount(10); // Placeholder dummy count
          return;
         }
         const data = await dataResponse.json();
         setSeptaListingsCount(Array.isArray(data) ? data.length : 0);


      } catch (err: any) {
        console.error('Error fetching SEPTA opportunities:', err);
        setError(err.message || 'An unexpected error occurred while fetching SEPTA opportunities.');
        setSeptaListingsCount(0);
      }
    };

    fetchSeptaOpportunities();
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4"> {/* Updated grid */}
              {/* SAM.gov Card */}
              <Card className="lg:col-span-1 xl:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Adjusted span */}
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium text-primary">SAM.gov</CardTitle>
                   <Building className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Federal contracting opportunities.</CardDescription>
                  <div className="mt-4 flex items-center justify-between">
                     <TotalListingsLabel total={20} loading={false} /> {/* Placeholder total */}
                    <Button onClick={() => navigateTo('/sam-gov')} size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">View</Button>
                  </div>
                </CardContent>
              </Card>

              {/* SEPTA Card */}
              <Card className="lg:col-span-1 xl:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Adjusted span */}
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

               {/* Recommendations Card */}
               <Card className="lg:col-span-1 xl:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Adjusted span */}
                   <CardHeader>
                       <CardTitle>Recommendations</CardTitle>
                       <CardDescription>Opportunities you might like.</CardDescription>
                   </CardHeader>
                   <CardContent className="grid gap-3">
                       {/* Placeholder recommendations */}
                       <div className="text-sm border-b pb-2">
                           <p className="font-medium truncate">Cybersecurity Training Program</p>
                           <p className="text-xs text-muted-foreground">Dept. of Homeland Security</p>
                       </div>
                        <div className="text-sm">
                           <p className="font-medium truncate">HVAC Maintenance Contract</p>
                           <p className="text-xs text-muted-foreground">SEPTA</p>
                       </div>
                       <Button variant="outline" size="sm" className="mt-2 justify-self-start">View All</Button>
                   </CardContent>
               </Card>

                {/* Quick Links Card */}
                <Card className="lg:col-span-1 xl:col-span-1 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Adjusted span */}
                   <CardHeader>
                       <CardTitle>Quick Links</CardTitle>
                   </CardHeader>
                   <CardContent className="grid gap-2">
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

              {/* Ongoing Bids Table */}
               <Card className="md:col-span-2 lg:col-span-2 xl:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Spans 2 columns */}
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
                     </TableBody>
                   </Table>
                 </CardContent>
               </Card>


              {/* Bids by Category Chart Card */}
              <Card className="md:col-span-2 lg:col-span-2 xl:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Spans 2 columns */}
                <CardHeader>
                  <CardTitle>Bids by Category</CardTitle>
                  <CardDescription>Distribution of bids across different categories.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BidsByCategoryChart />
                </CardContent>
              </Card>

              {/* Bids by Portal Chart Card */}
               <Card className="md:col-span-2 lg:col-span-2 xl:col-span-2 hover:shadow-lg transition-shadow duration-200 rounded-lg"> {/* Spans 2 columns */}
                  <BidsByPortalChart />
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

