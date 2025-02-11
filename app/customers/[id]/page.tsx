// app/customers/[id]/page.tsx

import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import CustomerInfo from "./components/customer-info"
import CustomerShipments from "./components/customer-shipments"
import EditCustomerDialog from "./components/edit-customer-dialog"
import { BalanceButtons } from "./components/BalanceButtons"

// If in Next.js 15, `params` is asynchronous:
type CustomerParams = Promise<{ id: string }>

async function getCustomer(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${id}`,
    { cache: "no-store" }
  )
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error("Failed to fetch customer")
  }
  return res.json()
}

export default async function CustomerDetailsPage({
  params,
}: {
  params: CustomerParams
}) {
  // 1) Await the params
  const { id } = await params

  // 2) Then fetch data
  const customer = await getCustomer(id)

  // 3) Handle not found
  if (!customer) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Details</h1>
        </div>
        <div className="flex space-x-2">
          <EditCustomerDialog customer={customer}>
            <Button variant="outline">Edit Customer</Button>
          </EditCustomerDialog>
          <BalanceButtons customer={customer} />
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Customer Info</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}>
                <CustomerInfo customer={customer} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle>Partial Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}>
                <CustomerShipments customerId={customer.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
