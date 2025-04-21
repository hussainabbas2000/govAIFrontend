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
import {Input} from '@/components/ui/input';
import {useEffect, useState} from 'react';
import {getSamGovOpportunities, SamGovOpportunity} from '@/services/sam-gov';
import {getSeptaOpportunities, SeptaOpportunity} from '@/services/septa';

export default function Home() {
  const [samGovOpportunities, setSamGovOpportunities] = useState<
    SamGovOpportunity[]
  >([]);
  const [septaOpportunities, setSeptaOpportunities] = useState<
    SeptaOpportunity[]
  >([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      const samGovData = await getSamGovOpportunities({});
      const septaData = await getSeptaOpportunities({});
      setSamGovOpportunities(samGovData);
      setSeptaOpportunities(septaData);
    };

    fetchOpportunities();
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <Icons.logo className="h-6 w-auto" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Opportunities</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Icons.home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Icons.search className="h-4 w-4" />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Input placeholder="Search..." />
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 p-4">
        {/* Main content here */}
        <h1>Welcome to GovContract Navigator</h1>

        <h2>SAM.gov Opportunities</h2>
        <ul>
          {samGovOpportunities.map(opportunity => (
            <li key={opportunity.id}>
              {opportunity.title} - {opportunity.agency} ({opportunity.location})
            </li>
          ))}
        </ul>

        <h2>SEPTA Opportunities</h2>
        <ul>
          {septaOpportunities.map(opportunity => (
            <li key={opportunity.id}>
              {opportunity.title} - {opportunity.department} ({opportunity.location})
            </li>
          ))}
        </ul>
      </main>
    </SidebarProvider>
  );
}
