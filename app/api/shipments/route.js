// app/api/shipments/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all shipments, optionally filter by status=open|closed

export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') // "open" or "closed" (optional)
      const destination = searchParams.get('destination') // optional filter by destination
  
      let whereClause = {}
      if (status === 'open') {
        whereClause.isOpen = true
      } else if (status === 'closed') {
        whereClause.isOpen = false
      }
  
      if (destination) {
        whereClause.destination = destination
      }
  
      const shipments = await prisma.shipment.findMany({
        where: whereClause,
        orderBy: { dateCreated: 'desc' },
      })
  
      return NextResponse.json(shipments)
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

// POST a new shipment
export async function POST(request) {
  try {
    const body = await request.json()
    const { destination } = body

    // // Ensure only one open shipment per destination
    // const existingOpenShipment = await prisma.shipment.findFirst({
    //   where: {
    //     destination,
    //     isOpen: true,
    //   },
    // })
    // if (existingOpenShipment) {
    //   return NextResponse.json(
    //     { error: `An open shipment for ${destination} already exists.` },
    //     { status: 400 }
    //   )
    // }

    const newShipment = await prisma.shipment.create({
      data: {
        destination,
      },
    })

    return NextResponse.json(newShipment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
