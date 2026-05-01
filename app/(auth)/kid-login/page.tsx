import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { loginKid } from '@/lib/actions/auth'
import Link from 'next/link'

export default function KidLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Kid Login ⭐
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginKid} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                name="familyName"
                placeholder="The Smiths"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kidName">Your Name</Label>
              <Input
                id="kidName"
                name="kidName"
                placeholder="Alex"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                name="passcode"
                type="password"
                placeholder="••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
              Let&apos;s Go! 🚀
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Are you a parent?{' '}
            <Link href="/login" className="text-orange-600 underline">
              Parent Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
