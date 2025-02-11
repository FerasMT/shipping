"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Customer {
  id: number
  name: string
  phone: string | null
  address: string
  balance: number
}
export function BalanceButtons({ customer }: { customer: Customer }) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAddBalance = async () => {
    const amountStr = prompt("Enter amount to add to balance:")
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount)) {
      toast({
        title: "Error",
        description: "Invalid amount",
        variant: "destructive",
      })
      return
    }
    setIsProcessing(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // Assuming your backend accepts a field like `balanceIncrement`
          body: JSON.stringify({ balanceIncrement: amount }),
        }
      )
      if (!res.ok) throw new Error("Failed to add balance")
      toast({
        title: "Success",
        description: "Balance added successfully.",
      })
      router.refresh()
    } catch (error: unknown) {
      // Type guard: check if error is an instance of Error
      const errorMessage = error instanceof Error ? error.message : "Failed to add balance";
    
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveBalance = async () => {
    const amountStr = prompt("Enter amount to remove from balance:")
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount)) {
      toast({
        title: "Error",
        description: "Invalid amount",
        variant: "destructive",
      })
      return
    }
    setIsProcessing(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // Send a negative increment to reduce balance.
          body: JSON.stringify({ balanceIncrement: -amount }),
        }
      )
      if (!res.ok) throw new Error("Failed to remove balance")
      toast({
        title: "Success",
        description: "Balance updated successfully.",
      })
      router.refresh()
    } catch (error: unknown) {
      // Type guard: check if error is an instance of Error
      const errorMessage = error instanceof Error ? error.message : "Failed to remove balance";
    
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={handleAddBalance} disabled={isProcessing}>
        Add Balance
      </Button>
      <Button variant="outline" onClick={handleRemoveBalance} disabled={isProcessing}>
        Remove Balance
      </Button>
    </div>
  )
}
