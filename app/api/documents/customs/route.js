// app/api/documents/customs/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request) {
  try {
    const { shipmentId } = await request.json()

    const shipment = await prisma.shipment.findUnique({
      where: { id: Number(shipmentId) },
      include: { partialShipments: true },
    })
    if (!shipment || shipment.isOpen) {
      return NextResponse.json({ error: 'Shipment not found or not closed' }, { status: 400 })
    }

    // TODO: Create a customs document PDF summarizing total weight, volume, etc.
    return NextResponse.json({
      message: 'Customs document generated',
      shipment,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
