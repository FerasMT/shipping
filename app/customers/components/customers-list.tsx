import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
interface Customer {
  id: number
  name: string
  phone: string | null
  address: string
  balance: number
}
async function getCustomers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers`, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("Failed to fetch customers")
  }
  return res.json()
}

export default async function CustomersList() {
  const customers = await getCustomers()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer: Customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:underline">
                {customer.name}
              </Link>
            </TableCell>
            <TableCell>{customer.phone}</TableCell>
            <TableCell>{customer.address}</TableCell>
            <TableCell className="text-right">${customer.balance.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

