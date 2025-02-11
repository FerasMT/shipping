import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import CustomersList from "./components/customers-list"
import AddCustomerDialog from "./components/add-customer-dialog"

export default function CustomersPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <AddCustomerDialog>
          <Button size="lg">Add Customer</Button>
        </AddCustomerDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}>
            <CustomersList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

