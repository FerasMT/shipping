// pages/dashboard.jsx (or similar)
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import OpenShipments from "@/components/open-shipments"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shipping Management Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/new-shipment">
          <Button className="w-full h-24 text-lg">New Shipment</Button>
        </Link>
        <Link href="/customers">
          <Button className="w-full h-24 text-lg" variant="secondary">
            Customers
          </Button>
        </Link>
        <Link href="/shipments/closed">
          <Button className="w-full h-24 text-lg" variant="secondary">
            Closed Shipments
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Shipments Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            }
          >
            <OpenShipments />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
