// components/open-shipments.jsx
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


// 1. Define the Shipment type
interface Shipment {
  id: string
  destination: string
  dateCreated: string // or Date if you parse it server-side
}
// Helper function that fetches open shipments from the API.
// Here we’re calling the API endpoint directly. If you prefer, you can
// query the database directly since this is a server component.
async function getOpenShipments() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/shipments?status=open`,
    { cache: "no-cache" }
  )
  if (!res.ok) {
    throw new Error("Failed to fetch open shipments")
  }
  return res.json()
}

export default async function OpenShipments() {
  const shipments = await getOpenShipments()

  if (!shipments || shipments.length === 0) {
    return <p className="text-muted-foreground">No open shipments found.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {shipments.map((shipment: Shipment) => (
        // Wrap each shipment card in a Link that points to the details page.
        <Link key={shipment.id} href={`/shipments/${shipment.id}`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Shipment #{shipment.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Destination:</strong> {shipment.destination}
              </p>
              <p>
                <strong>Date Created:</strong>{" "}
                {new Date(shipment.dateCreated).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
