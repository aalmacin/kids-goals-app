import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { setupFamily, getParentFamily } from '@/lib/actions/auth'

export default async function FamilySetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const family = await getParentFamily()
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
      <Card className="w-full max-w-md">
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
    </div>
  )
}
