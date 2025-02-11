"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

// Updated type definitions.
// (Assumes that the GET endpoint for a customer returns partial shipments with an included parent shipment object.)
interface ShipmentInfo {
  id: number
  destination: string
  dateClosed: string | null
}


interface PartialShipment {
  id: number
  cost: number
  amountPaid: number
  paymentStatus: string | null
  paymentCompleted: boolean
  shipmentId: number
  shipment?: ShipmentInfo
  // You might have additional fields like items, packages, etc.
}

interface CustomerShipmentsProps {
  customerId: number
}

async function getCustomerShipments(customerId: number): Promise<PartialShipment[]> {
  // We assume that the customer endpoint includes the partialShipments array
  // with parent shipment info. The query parameter "includeShipments=true" is used
  // to trigger the backend to use include: { partialShipments: { include: { shipment: true, ... } } }.
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}?includeShipments=true`,
    { cache: "no-store" }
  )
  if (!res.ok) {
    throw new Error("Failed to fetch customer shipments")
  }
  const data = await res.json()
  return data.partialShipments
}

export default function CustomerShipments({ customerId }: CustomerShipmentsProps) {
  const [shipments, setShipments] = useState<PartialShipment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCustomerShipments(customerId)
      .then((data) => setShipments(data))
      .catch((error) =>
        toast({ title: "Error", description: error.message, variant: "destructive" })
      )
      .finally(() => setIsLoading(false))
  }, [customerId])

  // Handler for marking a shipment's payment as done.
  const handleMarkPaymentDone = async (partialId: number, shipment: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shipments/${shipment}/partial-shipments/${partialId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentCompleted: true }),
        }
      )
      if (!res.ok) throw new Error("Failed to mark payment as done")
      toast({ title: "Success", description: "Payment marked as done." })
      // Refresh shipments list after update.
      const updatedShipments = await getCustomerShipments(customerId)
      setShipments(updatedShipments)
    } catch (error: unknown) {
      // Type guard: check if error is an instance of Error
      const errorMessage = error instanceof Error ? error.message : "Failed to mark payment as done";
    
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return <p>Loading shipments...</p>
  }

  if (shipments.length === 0) {
    return <p>No shipments found for this customer.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Shipment</TableHead>
          <TableHead>Date Closed</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead>Outstanding</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shipments.map((partial) => {
          // Use parent shipment info if available.
          const shipmentDest = partial.shipment
            ? partial.shipment.destination
            : partial.shipmentId.toString()
            const shipmentID = partial.shipment
            ? partial.shipment.id
            : partial.shipmentId
          const dateClosed =
            partial.shipment && partial.shipment.dateClosed
              ? new Date(partial.shipment.dateClosed).toLocaleString()
              : "N/A"
          const outstanding = partial.cost - partial.amountPaid
          return (
            <TableRow key={partial.id}>
              <TableCell>{partial.id}</TableCell>
              <TableCell>{shipmentDest}</TableCell>
              <TableCell>{dateClosed}</TableCell>
              <TableCell>
                {partial.paymentStatus || "N/A"}{" "}
                {partial.paymentCompleted ? "(Done)" : ""}
              </TableCell>
              <TableCell>{outstanding > 0 ? `$${outstanding.toFixed(2)}` : "$0.00"}</TableCell>
              <TableCell>
                {(!partial.paymentCompleted && outstanding > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkPaymentDone(partial.id, shipmentID)}
                  >
                    Mark Payment Done
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
