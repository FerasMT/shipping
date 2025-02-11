// app/api/shipments/[shipmentId]/partial-shipments/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  const { shipmentId } = params
  console.log('GET request received with shipmentId:', shipmentId)
  try {
    const partialShipments = await prisma.partialShipment.findMany({
      where: { shipmentId: Number(shipmentId) },
      include: { packages: true, items: true },
    })
    return NextResponse.json(partialShipments)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


export async function POST(request, { params }) {
    const { shipmentId } = await params
    try {
      const body = await request.json()
  
      // Extract fields from the payload.
      const {
        customerId,
        receiverName,
        receiverPhone,
        receiverAddress,
        cost,
        amountPaid,
        paymentStatus,         // e.g. "paid", "unpaid", "partially_paid"
        paymentResponsibility, // e.g. "customer" or "receiver"
        packages,              // an array of package details: each with { length, width, height, weight }
        items,                 // an array of shipment items: each with { weight, origin, hscode, amount, value }
      } = body
  
      // Validate that packages exist.
      if (!packages || !Array.isArray(packages) || packages.length === 0) {
        console.log("e",body.packages )
        return NextResponse.json(
          { error: "At least one package detail must be provided." },
          { status: 401 }
        )
      }
  
      // Validate that items exist.
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: "At least one shipment item must be provided." },
          { status: 400 }
        )
      }
  
      // Compute total volume from packages: sum of (length × width × height) for each package.
      const totalVolume = packages.reduce((acc, pkg) => {
        const len = parseFloat(pkg.length)
        const wid = parseFloat(pkg.width)
        const hei = parseFloat(pkg.height)
        return acc + (len * wid * hei)
      }, 0)
  
      // Compute total weight from packages: sum of each package’s weight.
      const totalWeight = packages.reduce((acc, pkg) => {
        return acc + parseFloat(pkg.weight)
      }, 0)
  
      // Parse cost and amountPaid.
      const parsedCost = parseFloat(cost)
      const parsedAmountPaid = parseFloat(amountPaid)
  
      // Compute outstanding amount if payment is not "paid".
      const outstanding = paymentStatus !== "paid" ? parsedCost - parsedAmountPaid : 0
  
      // Use a transaction so that creation of the partial shipment, nested creation of packages and items,
      // updating of the shipment totals, and updating of the customer balance occur atomically.
      const newPartialShipment = await prisma.$transaction(async (tx) => {
        // Create the PartialShipment with nested creation for package details and shipment items.
        const partialShipment = await tx.partialShipment.create({
          data: {
            shipmentId: Number(shipmentId),
            customerId: Number(customerId),
            receiverName,
            receiverPhone,
            receiverAddress,
            volume: totalVolume, // store the computed total volume
            cost: parsedCost,
            amountPaid: parsedAmountPaid,
            paymentStatus,
            paymentResponsibility,
            packages: {
              create: packages.map((pkg) => ({
                length: parseFloat(pkg.length),
                width: parseFloat(pkg.width),
                height: parseFloat(pkg.height),
                weight: parseFloat(pkg.weight),
              })),
            },
            items: {
              create: items.map((item) => ({
                weight: parseFloat(item.weight),
                origin: item.origin,
                hscode: item.hscode,
                amount: parseFloat(item.amount),
                value: parseFloat(item.value),
              })),
            },
          },
        })
  
        // Update the parent Shipment totals.
        await tx.shipment.update({
          where: { id: Number(shipmentId) },
          data: {
            totalVolume: { increment: totalVolume },
            totalWeight: { increment: totalWeight },
          },
        })
  
        // If payment is not "paid" and the responsibility is on the customer,
        // update the customer's balance by adding the outstanding amount.
        if (paymentStatus !== "paid" && paymentResponsibility === "customer" && outstanding > 0) {
          await tx.customer.update({
            where: { id: Number(customerId) },
            data: {
              balance: { increment: outstanding },
            },
          })
        }
  
        return partialShipment
      })
  
      return NextResponse.json(newPartialShipment, { status: 201 })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
