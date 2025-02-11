"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

// Updated Customer interface
interface Customer {
  id: number
  name: string
  phone: string
  address: string
}


export default function AddPartialShipmentPage() {
  const router = useRouter()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])

  // New customer info includes full details.
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    phone: "",
    address: "",
  })

  // General form data (except package details & shipment items)
  const [formData, setFormData] = useState({
    customerId: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    cost: "",
    amountPaid: "",
    paymentStatus: "unpaid", // default option
  })

  // Payment responsibility state (only used when paymentStatus is not "paid")
  const [paymentResponsibility, setPaymentResponsibility] = useState("customer")

  // Existing Shipment Items section (unchanged)
  const [items, setItems] = useState([
    { weight: "", origin: "", hscode: "", amount: "", value: "" }
  ])

  // NEW: Package Details – allow one or more package details entries.
  const [packageDetails, setPackageDetails] = useState([
    { length: "", width: "", height: "", weight: "" }
  ])

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers`)
      if (!response.ok) throw new Error("Failed to fetch customers")
      const data = await response.json()
      setCustomers(data)
    } catch (error: unknown) {
      // Type guard: check if error is an instance of Error
      const errorMessage = error instanceof Error ? error.message : "Failed to load customers. Please try again.";
    
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // --- Shipment Items handlers (unchanged) ---
  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }
  const addItem = () => {
    setItems([...items, { weight: "", origin: "", hscode: "", amount: "", value: "" }])
  }
  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)
  }

  // --- Package Details handlers ---
  const handlePackageDetailChange = (index: number, field: string, value: string) => {
    const updatedPackages = [...packageDetails]
    updatedPackages[index] = { ...updatedPackages[index], [field]: value }
    setPackageDetails(updatedPackages)
  }
  const addPackageDetail = () => {
    setPackageDetails([...packageDetails, { length: "", width: "", height: "", weight: "" }])
  }
  const removePackageDetail = (index: number) => {
    const updatedPackages = packageDetails.filter((_, i) => i !== index)
    setPackageDetails(updatedPackages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
  
    try {
      let customerId = formData.customerId
  
      // If new customer info is provided, create a new customer.
      if (newCustomerData.name.trim()) {
        const customerResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/customers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newCustomerData.name,
              phone: newCustomerData.phone,
              address: newCustomerData.address,
            }),
          }
        )
        if (!customerResponse.ok)
          throw new Error("Failed to create new customer")
        const newCustomerResult = await customerResponse.json()
        customerId = newCustomerResult.id
      }
  
      // Compute total volume and total weight from packageDetails.
      const totalVolume = packageDetails.reduce((acc, pkg) => {
        const len = Number.parseFloat(pkg.length) || 0
        const wid = Number.parseFloat(pkg.width) || 0
        const hei = Number.parseFloat(pkg.height) || 0
        return acc + (len * wid * hei)
      }, 0)
      const totalWeight = packageDetails.reduce((acc, pkg) => {
        return acc + (Number.parseFloat(pkg.weight) || 0)
      }, 0)
  
      // Prepare payload.
      const payload: any = {
        ...formData,
        customerId,
        totalVolume,
        totalWeight,
        cost: Number.parseFloat(formData.cost),
        amountPaid: Number.parseFloat(formData.amountPaid),
        items, // shipment items array (unchanged)
        packages: packageDetails, // **Changed key:** now sending packageDetails under "packages"
      }
      if (formData.paymentStatus !== "paid") {
        payload.paymentResponsibility = paymentResponsibility
      }
  
      // Send payload to backend.
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shipments/${id}/partial-shipments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
  
      if (!response.ok) {
        throw new Error("Failed to create partial shipment")
      }
  
      toast({
        title: "Success",
        description: "Partial shipment added successfully.",
      })
      router.push(`/shipments/${id}`)
    } catch (error) {
      toast({
        title: `Error ${error}`,
        description: "Failed to add partial shipment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Add Partial Shipment</h1>

      <form onSubmit={handleSubmit}>
        {/* Customer Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="customerId">Select Existing Customer</Label>
                <Select
                  name="customerId"
                  value={formData.customerId}
                  onValueChange={(value) => handleSelectChange("customerId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Or Add New Customer</Label>
                <Input
                  id="newCustomerName"
                  value={newCustomerData.name}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, name: e.target.value })
                  }
                  placeholder="Customer Name"
                />
                <Input
                  id="newCustomerPhone"
                  value={newCustomerData.phone}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, phone: e.target.value })
                  }
                  placeholder="Customer Phone"
                />
                <Input
                  id="newCustomerAddress"
                  value={newCustomerData.address}
                  onChange={(e) =>
                    setNewCustomerData({ ...newCustomerData, address: e.target.value })
                  }
                  placeholder="Customer Address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receiver Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Receiver Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receiverName">Receiver Name</Label>
              <Input
                id="receiverName"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="receiverPhone">Receiver Phone</Label>
              <Input
                id="receiverPhone"
                name="receiverPhone"
                value={formData.receiverPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="receiverAddress">Receiver Address</Label>
              <Input
                id="receiverAddress"
                name="receiverAddress"
                value={formData.receiverAddress}
                onChange={handleInputChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Package Details Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Package Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packageDetails.map((pkg, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`pkg-length-${index}`}>Length (m)</Label>
                    <Input
                      id={`pkg-length-${index}`}
                      value={pkg.length}
                      onChange={(e) => handlePackageDetailChange(index, "length", e.target.value)}
                      placeholder="Length"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`pkg-width-${index}`}>Width (m)</Label>
                    <Input
                      id={`pkg-width-${index}`}
                      value={pkg.width}
                      onChange={(e) => handlePackageDetailChange(index, "width", e.target.value)}
                      placeholder="Width"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`pkg-height-${index}`}>Height (m)</Label>
                    <Input
                      id={`pkg-height-${index}`}
                      value={pkg.height}
                      onChange={(e) => handlePackageDetailChange(index, "height", e.target.value)}
                      placeholder="Height"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`pkg-weight-${index}`}>Weight (kg)</Label>
                    <Input
                      id={`pkg-weight-${index}`}
                      value={pkg.weight}
                      onChange={(e) => handlePackageDetailChange(index, "weight", e.target.value)}
                      placeholder="Weight"
                      type="number"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
                {packageDetails.length > 1 && (
                  <Button variant="destructive" onClick={() => removePackageDetail(index)} size="sm">
                    Remove Package
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addPackageDetail} size="sm">
              Add Package
            </Button>
          </CardContent>
        </Card>

        {/* Payment Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cost">Total Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input
                id="amountPaid"
                name="amountPaid"
                type="number"
                step="0.01"
                value={formData.amountPaid}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                name="paymentStatus"
                value={formData.paymentStatus}
                onValueChange={(value) => handleSelectChange("paymentStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.paymentStatus !== "paid" && (
              <div>
                <Label htmlFor="paymentResponsibility">Outstanding Payment Responsibility</Label>
                <Select
                  name="paymentResponsibility"
                  value={paymentResponsibility}
                  onValueChange={(value) => setPaymentResponsibility(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="receiver">Receiver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipment Items Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`item-weight-${index}`}>Item Weight</Label>
                    <Input
                      id={`item-weight-${index}`}
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, "weight", e.target.value)}
                      placeholder="Weight"
                      type="number"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`item-origin-${index}`}>Origin</Label>
                    <Input
                      id={`item-origin-${index}`}
                      value={item.origin}
                      onChange={(e) => handleItemChange(index, "origin", e.target.value)}
                      placeholder="Origin"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`item-hscode-${index}`}>HS Code</Label>
                    <Input
                      id={`item-hscode-${index}`}
                      value={item.hscode}
                      onChange={(e) => handleItemChange(index, "hscode", e.target.value)}
                      placeholder="HS Code"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`item-amount-${index}`}>Amount</Label>
                    <Input
                      id={`item-amount-${index}`}
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                      placeholder="Amount"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`item-value-${index}`}>Value</Label>
                    <Input
                      id={`item-value-${index}`}
                      value={item.value}
                      onChange={(e) => handleItemChange(index, "value", e.target.value)}
                      placeholder="Value"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                {items.length > 1 && (
                  <Button variant="destructive" onClick={() => removeItem(index)} size="sm">
                    Remove Item
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addItem} size="sm">
              Add Item
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Partial Shipment...
            </>
          ) : (
            "Add Partial Shipment"
          )}
        </Button>
      </form>
    </div>
  )
}
