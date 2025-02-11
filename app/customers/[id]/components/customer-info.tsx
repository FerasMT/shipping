import { Card, CardContent } from "@/components/ui/card"

interface Customer {
  id: number
  name: string
  phone: string
  address: string
  balance: number
}

export default function CustomerInfo({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-4">
      <div>
        <strong>Name:</strong> {customer.name}
      </div>
      <div>
        <strong>Phone:</strong> {customer.phone}
      </div>
      <div>
        <strong>Address:</strong> {customer.address}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">Current Balance: ${customer.balance.toFixed(2)}</div>
          {customer.balance > 0 && (
            <p className="text-sm text-muted-foreground mt-2">This customer has outstanding payments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

