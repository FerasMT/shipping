// app/api/customers/[customerId]/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request, { params }) {
  const { customerId } = params
  try {
    const body = await request.json()

    // Create an object for data to update.
    // If the client sends "balanceIncrement", we update the balance using increment.
    let dataToUpdate = { ...body }

    if (body.balanceIncrement !== undefined) {
      dataToUpdate.balance = { increment: body.balanceIncrement }
      // Optionally remove balanceIncrement so it isn't used directly:
      delete dataToUpdate.balanceIncrement
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(customerId) },
      data: dataToUpdate,
    })
    return NextResponse.json(updatedCustomer)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  const { customerId } = params
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) },
      include: {
        partialShipments: {include: { shipment: true}, }, // get the shipments belonging to this customer
      },
    })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { customerId } = params
  try {
    await prisma.customer.delete({
      where: { id: Number(customerId) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
