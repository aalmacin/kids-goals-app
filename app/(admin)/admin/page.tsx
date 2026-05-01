import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/kids">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Kids</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Manage kids in your family</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/chores">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Chores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Manage chore library and assignments</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/effort">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Effort Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Set rewards for daily effort</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/rewards">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Manage redeemable rewards</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/family">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Family</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">Update family name</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
