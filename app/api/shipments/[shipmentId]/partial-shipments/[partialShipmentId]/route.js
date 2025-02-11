// app/api/shipments/[shipmentId]/partial-shipments/[partialShipmentId]/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const { shipmentId, partialShipmentId } = params
  try {
    const partialShipment = await prisma.partialShipment.findUnique({
      where: { id: Number(partialShipmentId) },
      include: { packages: true, items: true },
    })
    if (!partialShipment || partialShipment.shipmentId !== Number(shipmentId)) {
      return NextResponse.json({ error: 'Partial shipment not found' }, { status: 404 })
    }
    return NextResponse.json(partialShipment)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const { shipmentId, partialShipmentId } = params
  try {
    const body = await request.json()
    // e.g. { weight, cost, amountPaid, paymentStatus, etc. }

    // First, find partial shipment to ensure it belongs to the shipment
    const existing = await prisma.partialShipment.findUnique({
      where: { id: Number(partialShipmentId) },
    })
    if (!existing || existing.shipmentId !== Number(shipmentId)) {
      return NextResponse.json({ error: 'Partial shipment not found' }, { status: 404 })
    }
    console.log('e', body)
    const updatedPartial = await prisma.partialShipment.update({
      where: { id: Number(partialShipmentId) },
      data: body,
    })

    return NextResponse.json(updatedPartial)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { shipmentId, partialShipmentId } = await params
  console.log('ee', shipmentId)
  try {
    // Verify partial shipment
    const existing = await prisma.partialShipment.findUnique({
      where: { id: Number(partialShipmentId) },
    })
    if (!existing || existing.shipmentId !== Number(shipmentId)) {
      return NextResponse.json({ error: 'Partial shipment not found' }, { status: 404 })
    }

    await prisma.partialShipment.delete({
      where: { id: Number(partialShipmentId) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
