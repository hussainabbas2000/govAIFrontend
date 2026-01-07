'use client';

import { useRouter, usePathname } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { 
  Building, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Link as LinkIcon, 
  Settings, 
  LifeBuoy, 
  UserCog,
  ChevronRight,
  Home,
  Handshake
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

// Breadcrumb configuration based on path segments
const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [
    { label: 'Dashboard', href: '/' }
  ];

  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Map segments to readable labels
    let label = segment;
    
    if (segment === 'sam-gov') {
      label = 'SAM.gov Opportunities';
    } else if (segment === 'septa') {
      label = 'SEPTA';
    } else if (segment === 'preferences') {
      label = 'Preferences';
    } else if (segment === 'recommendations') {
      label = 'Recommendations';
    } else if (segment === 'negotiations') {
      label = 'Negotiations';
    } else if (segment === 'rfq') {
      label = 'RFQ Details';
    } else if (segment === 'bid-summary') {
      label = 'Bid Summary';
    } else if (segment === 'quotenegotiation') {
      label = 'Vendor Negotiation';
    } else if (segment.match(/^[a-zA-Z0-9-]+$/) && segments[i-1] === 'sam-gov') {
      // This is an opportunity ID
      label = `Opportunity`;
    }
    
    breadcrumbs.push({ label, href: currentPath });
  }
  
  return breadcrumbs;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const navigateTo = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => navigateTo('/')}
            >
              <Icons.logo className="h-6 w-auto" />
            </Button>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive('/')} onClick={() => navigateTo('/')}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive('/sam-gov')} onClick={() => navigateTo('/sam-gov')}>
                  <Building className="h-4 w-4" />
                  <span>SAM.gov</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive('/septa')} onClick={() => navigateTo('/septa')}>
                  <Briefcase className="h-4 w-4" />
                  <span>SEPTA</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname.includes('quotenegotiation') || pathname === '/negotiations'} onClick={() => navigateTo('/negotiations')}>
                  <Handshake className="h-4 w-4" />
                  <span>Negotiations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive('/recommendations')} onClick={() => navigateTo('/recommendations')}>
                  <TrendingUp className="h-4 w-4" />
                  <span>Recommendations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive('/preferences')} onClick={() => navigateTo('/preferences')}>
                  <UserCog className="h-4 w-4" />
                  <span>Preferences</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => {}}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => {}}>
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
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  ) : (
                    <button
                      onClick={() => navigateTo(crumb.href)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </button>
                  )}
                </div>
              ))}
            </nav>
            
            {/* User Profile/Notifications */}
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <Button variant="ghost" size="icon">
                <Icons.user className="h-5 w-5" />
                <span className="sr-only">User Profile</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

