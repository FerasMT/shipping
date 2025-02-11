// app/api/shipments/[shipmentId]/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const { shipmentId } = await params
  console.log('GET request received with shipmentId:', shipmentId)

  try {
    const shipment = await prisma.shipment.findUnique({
        where: { id: Number(shipmentId) },
        include: {
          partialShipments: {
            include: {
              packages: true,
              items: true,
              customer: true, // if you want to include customer details as well
            },
          },
        },
      });
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }
    return NextResponse.json(shipment)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const { shipmentId } = params
  try {
    const body = await request.json()
    // body could include: isOpen, driverName, driverVehicle, dateClosed, etc.

    const updatedShipment = await prisma.shipment.update({
      where: { id: Number(shipmentId) },
      data: body,
    })
    return NextResponse.json(updatedShipment)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { shipmentId } = params
  try {
    // Caution: Deleting a shipment will also delete related partial shipments if set up with cascade.
    // By default, Prisma doesn't cascade unless specified in the schema. Typically you handle this carefully.
    await prisma.shipment.delete({
      where: { id: Number(shipmentId) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
