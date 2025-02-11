"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function NewShipmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [departureDate, setDepartureDate] = useState("")
  const [note, setNote] = useState("")

  const handleDestinationSelect = (destination: string) => {
    setSelectedDestination(destination)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDestination) {
      toast({
        title: "Error",
        description: "Please select a destination.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: selectedDestination,
          departureDate, // Note: these fields are sent but not stored in your model (unless updated)
          note,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create shipment")
      }

      const newShipment = await response.json()
      toast({
        title: "Success",
        description: `New shipment to ${newShipment.destination} created successfully.`,
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">New Shipment</h1>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Destination</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              className="flex-1 h-24 text-lg relative"
              variant={selectedDestination === "Syria" ? "default" : "outline"}
              onClick={() => handleDestinationSelect("Syria")}
            >
              Syria
            </Button>
            <Button
              type="button"
              className="flex-1 h-24 text-lg relative"
              variant={selectedDestination === "Saudi Arabia" ? "default" : "outline"}
              onClick={() => handleDestinationSelect("Saudi Arabia")}
            >
              Saudi Arabia
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="departureDate">Approximate Departure Date</Label>
              <Input
                id="departureDate"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter any additional notes here..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading || !selectedDestination}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Shipment...
            </>
          ) : (
            "Start Shipment"
          )}
        </Button>
      </form>
    </div>
  )
}
