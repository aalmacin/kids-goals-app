import { getKids } from '@/lib/actions/kids'
import { addKid, removeKid, editKid } from '@/lib/actions/kids'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Trash2 } from 'lucide-react'

export default async function KidsPage() {
  const kids = await getKids()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Kids</h1>

      {/* Add Kid Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add a Kid</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addKid} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Alex" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input id="birthday" name="birthday" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode (4–6 digits)</Label>
              <Input
                id="passcode"
                name="passcode"
                type="password"
                minLength={4}
                maxLength={6}
                pattern="[0-9]{4,6}"
                placeholder="1234"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Add Kid</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Kids List */}
      <div className="space-y-3">
        {kids.length === 0 && (
          <p className="text-gray-500 text-center py-8">No kids yet. Add one above!</p>
        )}
        {kids.map((kid) => (
          <Card key={kid.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-semibold text-gray-800">{kid.name}</p>
                <p className="text-sm text-gray-500">
                  Birthday: {new Date(kid.birthday).toLocaleDateString()}
                </p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                {kid.points} pts
              </Badge>
            </div>
            <form action={removeKid.bind(null, kid.id)}>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  )
}
