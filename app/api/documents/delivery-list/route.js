// app/api/documents/delivery-list/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const { shipmentId } = await request.json()

    const shipment = await prisma.shipment.findUnique({
      where: { id: Number(shipmentId) },
      include: { partialShipments: true },
    })
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // TODO: Generate a PDF listing all partialShipments and their receivers
    // Example, we just return a JSON
    return NextResponse.json({
      message: 'Delivery list generated',
      shipment,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
