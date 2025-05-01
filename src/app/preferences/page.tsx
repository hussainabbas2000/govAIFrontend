
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UserPreferences {
  opportunityType: 'product' | 'service' | 'product/service' | '';
  location: string;
  interestedDepartments: string;
}

export default function PreferencesPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    opportunityType: '',
    location: '',
    interestedDepartments: '',
  });
  const [isClient, setIsClient] = useState(false);

  // Load preferences from localStorage on mount (client-side only)
  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
        // Optionally clear invalid preferences
        // localStorage.removeItem('userPreferences');
      }
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: UserPreferences['opportunityType']) => {
    setPreferences(prev => ({ ...prev, opportunityType: value }));
  };

  const handleSavePreferences = () => {
    if (!isClient) return; // Prevent saving during SSR or before hydration

    try {
        localStorage.setItem('userPreferences', JSON.stringify(preferences));
        toast({
          title: "Preferences Saved",
          description: "Your preferences have been successfully updated.",
        });

        console.log(localStorage.getItem('userPreferences'))
    } catch (error) {
        console.error('Failed to save preferences:', error);
        toast({
          title: "Error Saving Preferences",
          description: "Could not save your preferences. Please try again.",
          variant: "destructive",
        });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>
            Set your preferences to personalize opportunity recommendations. These settings will help the AI find the most relevant listings for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="opportunityType">Opportunity Type</Label>
            <Select
              name="opportunityType"
              value={preferences.opportunityType}
              onValueChange={handleSelectChange}
              disabled={!isClient} // Disable until client-side hydration
            >
              <SelectTrigger id="opportunityType">
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product Based</SelectItem>
                <SelectItem value="service">Service Based</SelectItem>
                <SelectItem value="product/service">Product & Service Mix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="location">Preferred Location(s)</Label>
            <Input
              type="text"
              id="location"
              name="location"
              placeholder="e.g., Philadelphia, PA; New York, NY"
              value={preferences.location}
              onChange={handleInputChange}
              disabled={!isClient} // Disable until client-side hydration
            />
            <p className="text-xs text-muted-foreground">
              Enter cities, states, or regions separated by semicolons. Leave blank for nationwide.
            </p>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="interestedDepartments">Interested Departments/Agencies</Label>
            <Input
              type="text"
              id="interestedDepartments"
              name="interestedDepartments"
              placeholder="e.g., Department of Defense; GSA"
              value={preferences.interestedDepartments}
              onChange={handleInputChange}
              disabled={!isClient} // Disable until client-side hydration
            />
             <p className="text-xs text-muted-foreground">
              Enter specific agencies or departments separated by semicolons. Leave blank for all.
            </p>
          </div>

           <Button onClick={handleSavePreferences} disabled={!isClient}>
             Save Preferences
           </Button>
        </CardContent>
      </Card>
    </main>
  );
}
