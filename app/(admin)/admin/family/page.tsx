import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { setupFamily, getParentFamily, updateFamilyTimezoneAction } from '@/lib/actions/auth'

// Common IANA timezones grouped for usability
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET) — New York' },
  { value: 'America/Chicago', label: 'Central (CT) — Chicago' },
  { value: 'America/Denver', label: 'Mountain (MT) — Denver' },
  { value: 'America/Edmonton', label: 'Mountain (MT) — Edmonton' },
  { value: 'America/Phoenix', label: 'Mountain no DST — Phoenix' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT) — Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska (AKT) — Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT) — Honolulu' },
  { value: 'America/Toronto', label: 'Eastern (ET) — Toronto' },
  { value: 'America/Vancouver', label: 'Pacific (PT) — Vancouver' },
  { value: 'America/Winnipeg', label: 'Central (CT) — Winnipeg' },
  { value: 'Europe/London', label: 'GMT/BST — London' },
  { value: 'Europe/Paris', label: 'CET — Paris / Berlin' },
  { value: 'Europe/Helsinki', label: 'EET — Helsinki' },
  { value: 'Asia/Dubai', label: 'GST — Dubai' },
  { value: 'Asia/Kolkata', label: 'IST — India' },
  { value: 'Asia/Singapore', label: 'SGT — Singapore' },
  { value: 'Asia/Tokyo', label: 'JST — Tokyo' },
  { value: 'Australia/Sydney', label: 'AEST — Sydney' },
  { value: 'Pacific/Auckland', label: 'NZST — Auckland' },
  { value: 'UTC', label: 'UTC' },
]

export default async function FamilySetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const family = await getParentFamily()
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-indigo-700">
              {family ? 'Family Settings' : 'Set Up Your Family'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {params.error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {params.error}
              </p>
            )}
            <form action={setupFamily} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Family Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="The Smiths"
                  defaultValue={family?.name ?? ''}
                  required
                />
                <p className="text-xs text-gray-500">
                  Must be unique across the app
                </p>
              </div>
              <Button type="submit" className="w-full">
                {family ? 'Update Family Name' : 'Create Family'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {family && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-indigo-700">Timezone</CardTitle>
            </CardHeader>
            <CardContent>
              {params.success === 'timezone' && (
                <p className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-md">
                  Timezone updated.
                </p>
              )}
              <form action={updateFamilyTimezoneAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Family Timezone</Label>
                  <Select name="timezone" defaultValue={family.timezone ?? 'UTC'}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Used to determine which day chores are available for your kids.
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  Save Timezone
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
