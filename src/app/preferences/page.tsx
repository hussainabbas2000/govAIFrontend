'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getPreferences, updatePreferences, UserPreferences } from '@/lib/supabase/preferences'
import { useRouter } from 'next/navigation'

export default function PreferencesPage() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<UserPreferences>({
    opportunityType: '',
    location: '',
    interestedDepartments: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await getPreferences()
        setPreferences(data)
      } catch (err: any) {
        console.error('Error fetching preferences:', err.message)
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [toast])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPreferences(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: UserPreferences['opportunityType']) => {
    setPreferences(prev => ({ ...prev, opportunityType: value }))
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const data = await updatePreferences(preferences)
      setPreferences(data)
      toast({
        title: 'Preferences Saved',
        description: 'Your preferences have been successfully updated.',
      })
      router.push('/')

    } catch (err: any) {
      console.error('Failed to save preferences:', err.message)
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

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
          {loading ? (
            <p>Loading preferences...</p>
          ) : (
            <>
              {/* Opportunity Type */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="opportunityType">Opportunity Type</Label>
                <Select
                  name="opportunityType"
                  value={preferences.opportunityType}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="opportunityType">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product Based</SelectItem>
                    <SelectItem value="service">Service Based</SelectItem>
                    <SelectItem value="product/service">Product & Service Mix</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="location">Preferred Location(s)</Label>
                <Input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="e.g., Philadelphia, PA; New York, NY"
                  value={preferences.location}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter cities, states, or regions separated by semicolons. Leave blank for nationwide.
                </p>
              </div>

              {/* Interested Departments */}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="interestedDepartments">Interested Departments/Agencies</Label>
                <Input
                  type="text"
                  id="interestedDepartments"
                  name="interestedDepartments"
                  placeholder="e.g., Department of Defense; GSA"
                  value={preferences.interestedDepartments}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter specific agencies or departments separated by semicolons. Leave blank for all.
                </p>
              </div>

              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
