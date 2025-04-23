'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {Icons} from '@/components/icons';
import {useRouter} from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const navigateToSamGov = () => {
    router.push('/sam-gov');
  };

  const navigateToSepta = () => {
    router.push('/septa');
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <Icons.logo className="h-6 w-auto" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Icons.home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4">
        <h1>Welcome to GovContract Navigator</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-2">SAM.gov Opportunities</h2>
            <p>Discover federal contracting opportunities.</p>
            <button
              onClick={navigateToSamGov}
              className="bg-primary text-primary-foreground rounded-md p-2 hover:bg-primary/80"
            >
              View Opportunities
            </button>
          </div>
          <div className="border rounded-lg p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-2">SEPTA Opportunities</h2>
            <p>Explore contracting opportunities with SEPTA.</p>
            <button
              onClick={navigateToSepta}
              className="bg-primary text-primary-foreground rounded-md p-2 hover:bg-primary/80"
            >
              View Opportunities
            </button>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

