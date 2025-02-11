// app/api/documents/invoice/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()
    const { partialShipmentIds, customerId, shipmentId } = body

    // Query the data you need to build your invoice
    // Example: fetch partial shipments by IDs or by customer & shipment
    let partials = []
    if (partialShipmentIds) {
      partials = await prisma.partialShipment.findMany({
        where: { id: { in: partialShipmentIds } },
        include: { customer: true, packages: true },
      })
    } else if (customerId && shipmentId) {
      partials = await prisma.partialShipment.findMany({
        where: {
          customerId: customerId,
          shipmentId: shipmentId,
        },
        include: { customer: true, shipment: true },
      })
    }

    // TODO: Generate PDF or invoice data from partials
    // For now, we just return a JSON mock
    return NextResponse.json({
      message: 'Invoice generated',
      partials,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
