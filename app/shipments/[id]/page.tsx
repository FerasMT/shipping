"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { jsPDF } from "jspdf"
import "jspdf-autotable" // Ensure you have installed jspdf-autotable
import JSZip from "jszip"

// --- Updated Type Definitions ---

interface Customer {
  id: number
  name: string
  phone: string | null
  address: string
  balance: number
}

interface PackageDetail {
  id: number
  length: number
  width: number
  height: number
  weight: number
}

interface PartialShipmentItem {
  id: number
  weight: number
  origin: string
  hscode: string
  amount: number
  value: number
}

type ItemWithPartialId = Item & { partialShipmentId: string | number };


interface PartialShipment {
  id: number
  volume: number
  cost: number
  amountPaid: number
  paymentStatus?: string
  paymentResponsibility?: string
  isPaid: boolean
  receiverPhone: string | null
  receiverName: string | null
  receiverAddress: string | null
  customerId: number
  customer?: Customer
  packages?: PackageDetail[]
  items?: PartialShipmentItem[]
}

interface Shipment {
  id: number
  destination: string
  dateCreated: string
  isOpen: boolean
  totalWeight: number
  totalVolume: number
  driverName: string | null
  driverVehicle: string | null
  dateClosed: string | null
  note: string | null
  partialShipments: PartialShipment[]
}

interface Item {
  weight: number;
  origin: string;
  hscode: string;
  amount: number;
  value: number;
  // Add additional properties if needed.
}

interface Package {
  weight: number;
  length: number;
  width: number;
  height: number;
}


export default function OpenShipmentDetailsPage() {
  const router = useRouter()
  const { id } = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [driverName, setDriverName] = useState("")
  const [driverVehicle, setDriverVehicle] = useState("")

  useEffect(() => {
    fetchShipmentDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // After shipment loads, if any partial shipment is missing customer data,
  // fetch the customer details and update state.
  useEffect(() => {
    if (shipment) {
      const missingCustomerIds = shipment.partialShipments
        .filter((p) => !p.customer)
        .map((p) => p.customerId)
      const uniqueCustomerIds = Array.from(new Set(missingCustomerIds))
      if (uniqueCustomerIds.length > 0) {
        Promise.all(uniqueCustomerIds.map((custId) => fetchCustomer(custId)))
          .then((customers) => {
            const customerMap: { [key: number]: Customer } = {}
            customers.forEach((cust) => {
              customerMap[cust.id] = cust
            })
            setShipment((prev) => {
              if (!prev) return prev
              const updatedPartials = prev.partialShipments.map((p) => {
                if (!p.customer && customerMap[p.customerId]) {
                  return { ...p, customer: customerMap[p.customerId] }
                }
                return p
              })
              return { ...prev, partialShipments: updatedPartials }
            })
          })
          .catch((error) => {
            console.error("Error fetching customer data:", error)
          })
      }
    }
  }, [shipment])

  const fetchShipmentDetails = async () => {
    try {
      // Ensure your backend GET endpoint uses Prisma include:
      // include: { partialShipments: { include: { packages: true, items: true, customer: true } } }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shipments/${id}?includePackagesAndItems=true`
      )
      if (!response.ok) throw new Error("Failed to fetch shipment details")
      const data = await response.json()
      setShipment(data)
    } catch (error) {
      toast({
        title: `Error ${error}`,
        description: "Failed to load shipment details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomer = async (customerId: number): Promise<Customer> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}`
    )
    if (!response.ok) throw new Error("Failed to fetch customer")
    return response.json()
  }

  const handleCloseShipment = async () => {
    if (!driverName || !driverVehicle) {
      toast({
        title: "Error",
        description: "Please enter both driver name and vehicle information.",
        variant: "destructive",
      })
      return
    }
    setIsClosing(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shipments/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isOpen: false,
            driverName,
            driverVehicle,
            dateClosed: new Date().toISOString(),
          }),
        }
      )
      if (!response.ok) throw new Error("Failed to close shipment")
      toast({
        title: "Success",
        description: "Shipment closed successfully.",
      })
      router.push("/closed-shipments")
    } catch (error) {
      toast({
        title: `Error ${error}`,
        description: "Failed to close shipment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClosing(false)
    }
  }

  // Generate a PDF (Arrangement Invoice) using autoTable for better formatting.
  // The invoice now includes a "Date Received" field and properly calculates the total package weight.
  const handleGenerateArrangementInvoice = async (partialShipmentId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partialShipmentIds: [partialShipmentId] }),
        }
      )
      if (!response.ok) throw new Error("Failed to generate invoice")
      const invoiceData = await response.json()
      const doc = new jsPDF()

      // Title for the invoice
      doc.setFontSize(16)
      doc.text(invoiceData.message, 10, 20)

      // Start placing tables below the title
      let startY = 30

      // For each partial shipment in the invoice data
      invoiceData.partials.forEach((partial: PartialShipment) => {
        // Calculate total package weight and create package rows
        let packageTotalWeight = 0
        const packagesRows: Array<[string, string]> = []
        if (partial.packages && partial.packages.length > 0) {
          partial.packages.forEach((pkg: Package, idx: number) => {
            packageTotalWeight += pkg.weight
            packagesRows.push([
              `Package ${idx + 1}`,
              `Length: ${pkg.length} m, Width: ${pkg.width} m, Height: ${pkg.height} m, Weight: ${pkg.weight} kg`,
            ])
          })
        }

        // Create rows for the main details
        const tableRows: Array<[string, string]> = [
          ["Partial Shipment ID", partial.id.toString()],
        //   [
        //     "Date Received",
        //     partial.dateReceived
        //       ? new Date(partial.dateReceived).toLocaleString()
        //       : "N/A",
        //   ],
          ["Receiver", partial.receiverName || "N/A"],
          ["Sender", partial.customer?.name || "N/A"],
          ["Receiver Phone", partial.receiverPhone || "N/A"],
          ["Receiver Address", partial.receiverAddress || "N/A"],
        ]

        if (packagesRows.length > 0) {
          tableRows.push(["Packages", ""])
          packagesRows.forEach((row) => tableRows.push(row))
          tableRows.push(["Total Package Weight", packageTotalWeight + " kg"])
        } else {
          tableRows.push(["Total Package Weight", "N/A"])
        }

        tableRows.push(["Volume", partial.volume + " m³"])
        tableRows.push(["Cost", partial.cost.toString()])
        tableRows.push(["Amount Paid", partial.amountPaid.toString()])

        // Render the table using autoTable
        ;(doc as unknown as any).autoTable({
          startY: startY,
          head: [["Field", "Value"]],
          body: tableRows,
          theme: "grid",
          styles: { fontSize: 10 },
          headStyles: { fillColor: [22, 160, 133] },
        })

        // Update startY for the next table (if any)
        startY = (doc as unknown as any).lastAutoTable.finalY + 20
      })

      // Trigger a download of the PDF.
      const pdfBlob = doc.output("blob")
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `arrangement_invoice_${partialShipmentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: `Error ${error}`,
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Download all item details as an Excel (CSV) file.
  const handleDownloadItemsExcel = () => {
    if (!shipment || shipment.isOpen) {
      toast({
        title: "Error",
        description: "Shipment must be closed to download item details.",
        variant: "destructive",
      })
      return
    }
    const allItems: ItemWithPartialId[] = []
    shipment.partialShipments.forEach((partial) => {
      if (partial.items && partial.items.length > 0) {
        partial.items.forEach((item) => {
          allItems.push({ partialShipmentId: partial.id, ...item })
        })
      }
    })
    if (allItems.length === 0) {
      toast({
        title: "Error",
        description: "No item data available.",
        variant: "destructive",
      })
      return
    }
    const headers = [
      "PartialShipmentID",
      "Weight",
      "Origin",
      "HS Code",
      "Amount",
      "Value",
    ]
    const rows: string[] = []
    rows.push(headers.join(","))
    allItems.forEach((item) => {
      const row = [
        item.partialShipmentId.toString(),
        item.weight.toString(),
        `"${item.origin}"`,
        `"${item.hscode}"`,
        item.amount.toString(),
        item.value.toString(),
      ]
      rows.push(row.join(","))
    })
    const BOM = "\uFEFF"
    const csvContent = BOM + rows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "partial_shipments_items.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download handover info as an Excel (CSV) file.
  const handleDownloadHandoverInfo = () => {
    if (!shipment || shipment.isOpen) {
      toast({
        title: "Error",
        description: "Shipment must be closed to download handover info.",
        variant: "destructive",
      })
      return
    }
    const headers = [
      "PartialShipmentID",
      "Receiver Name",
      "Receiver Phone",
      "Receiver Address",
      "Sender Name",
      "Sender Phone",
      "Payment Status",
      "Payment Responsibility",
      "Number of Packages",
      "Total Package Weight",
      "Total Volume",
    ]
    const rows = shipment.partialShipments.map((partial) => {
      const numPackages = partial.packages ? partial.packages.length : 0
      const totalPackageWeight = partial.packages
        ? partial.packages.reduce((sum, pkg) => sum + pkg.weight, 0)
        : 0
      return [
        partial.id.toString(),
        partial.receiverName || "N/A",
        partial.receiverPhone || "N/A",
        partial.receiverAddress || "N/A",
        partial.customer ? partial.customer.name : "N/A",
        partial.customer ? partial.customer.phone || "N/A" : "N/A",
        partial.paymentStatus || "N/A",
        partial.paymentResponsibility || "N/A",
        numPackages.toString(),
        totalPackageWeight.toString(),
        partial.volume.toString(),
      ]
    })
    const BOM = "\uFEFF"
    const csvRows = [headers, ...rows].map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    )
    const csvString = BOM + csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "handover_info.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Open WhatsApp for the customer.
  const handleWhatsAppCustomer = (phone: string | null) => {
    if (!phone) {
      toast({
        title: "Error",
        description: "Customer phone number not available.",
        variant: "destructive",
      })
      return
    }
    const message = encodeURIComponent("Hello, regarding your shipment invoice...")
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  // Open WhatsApp for the receiver.
  const handleWhatsAppReceiver = (phone: string | null) => {
    if (!phone) {
      toast({
        title: "Error",
        description: "Receiver phone number not available.",
        variant: "destructive",
      })
      return
    }
    const message = encodeURIComponent("Hello, regarding your delivery...")
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  // Generate a ZIP file containing one ZPL file per package for the given partial shipment.
  const handleDownloadZebraFile = async (partialShipmentId: number) => {
    const partial = shipment?.partialShipments.find(
      (p) => p.id === partialShipmentId
    )
    if (!partial) {
      toast({
        title: "Error",
        description: "Partial shipment not found.",
        variant: "destructive",
      })
      return
    }
    if (!partial.packages || partial.packages.length === 0) {
      toast({
        title: "Error",
        description: "No packages available for zebra label.",
        variant: "destructive",
      })
      return
    }
    if (!shipment) {
      toast({
        title: "Error",
        description: "Shipment data not loaded.",
        variant: "destructive",
      });
      return;
    }
    // Determine destination suffix based on shipment.destination.
    let destinationSuffix = ""
    if (shipment.destination.toLowerCase().includes("saudia")) {
      destinationSuffix = "ZR"
    } else if (shipment.destination.toLowerCase().includes("syria")) {
      destinationSuffix = "ZA"
    } else {
      destinationSuffix = "XX"
    }
    // Get the last three digits of the customer's phone.
    let lastThree = "000"
    if (partial.customer && partial.customer.phone) {
      const phoneDigits = partial.customer.phone.replace(/\D/g, "")
      lastThree = phoneDigits.slice(-3) || phoneDigits
    }
    // Get the first letter from the customer's name.
    let firstLetter = ""
    if (partial.customer && partial.customer.name) {
      firstLetter = partial.customer.name.charAt(0).toUpperCase()
    }
    const totalPackages = partial.packages.length

    const zip = new JSZip()

    // For each package, generate a separate ZPL file.
    partial.packages.forEach((pkg, index) => {
      const packageNumber = index + 1
      const customId = `${shipment.id}${destinationSuffix}${lastThree}${packageNumber}/${totalPackages}`
      const labelContent = `^XA
^FO50,50^A0N,30,30^FDCustom ID: ${customId}^FS
^FO50,100^A0N,30,30^FDPartial Shipment: ${partial.id} - ${firstLetter}^FS
^FO50,150^A0N,30,30^FDPackage: ${packageNumber}/${totalPackages}^FS
^XZ
`
      // Name each file based on partial shipment and package index.
      const fileName = `zebra_label_partial_${partial.id}_package_${packageNumber}.zpl`
      zip.file(fileName, labelContent)
    })

    try {
      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `zebra_labels_partial_${partial.id}.zip`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: `Error ${error}`,
        description: "Failed to generate zebra labels. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!shipment) {
    return <div className="text-center">Shipment not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        Shipment to {shipment.destination}
      </h1>

      {/* Shipment Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Shipment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Date Created:</strong>{" "}
            {new Date(shipment.dateCreated).toLocaleString()}
          </p>
          <p>
            <strong>Total Weight:</strong> {shipment.totalWeight} kg
          </p>
          <p>
            <strong>Note:</strong> {shipment.note}
          </p>
          <p>
            <strong>Total Volume:</strong> {shipment.totalVolume} m³
          </p>
          { !shipment.isOpen && (
            <>
              <p>
                <strong>Date Closed:</strong>{" "}
                {shipment.dateClosed ? new Date(shipment.dateClosed).toLocaleString() : "N/A"}
              </p>
              <p>
                <strong>Driver:</strong> {shipment.driverName || "N/A"}
              </p>
              <p>
                <strong>Vehicle:</strong> {shipment.driverVehicle || "N/A"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Show Add/Close buttons only when shipment is open */}
      {shipment.isOpen && (
        <div className="flex justify-between items-center mb-6">
          <Button onClick={() => router.push(`/shipments/${id}/add-partial`)}>
            Add Partial Shipment
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Close Shipment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Close Shipment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driverName" className="text-right">
                    Driver Name
                  </Label>
                  <Input
                    id="driverName"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driverVehicle" className="text-right">
                    Vehicle Info
                  </Label>
                  <Input
                    id="driverVehicle"
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleCloseShipment} disabled={isClosing}>
                {isClosing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing Shipment...
                  </>
                ) : (
                  "Confirm Close"
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* When shipment is closed, show two download buttons */}
      {!shipment.isOpen && (
        <div className="flex space-x-2 mb-4">
          <Button variant="outline" onClick={handleDownloadItemsExcel}>
            Download All Items (Excel)
          </Button>
          <Button variant="outline" onClick={handleDownloadHandoverInfo}>
            Download Handover Info
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Partial Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Receiver Name</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Volume (m³)</TableHead>
                <TableHead>Paid Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.partialShipments.map((partial) => (
                <TableRow key={partial.id}>
                  <TableCell>{partial.id}</TableCell>
                  <TableCell>
                    {partial.customer ? partial.customer.name : "Loading..."}
                  </TableCell>
                  <TableCell>{partial.receiverName || "N/A"}</TableCell>
                  <TableCell>
                    {partial.packages
                      ? partial.packages.reduce((sum, pkg) => sum + pkg.weight, 0)
                      : "N/A"}
                  </TableCell>
                  <TableCell>{partial.volume}</TableCell>
                  <TableCell>{partial.isPaid ? "Paid" : "Unpaid"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleGenerateArrangementInvoice(partial.id)
                        }
                      >
                        Arrangement Invoice
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleWhatsAppCustomer(
                            partial.customer ? partial.customer.phone : null
                          )
                        }
                      >
                        WhatsApp Customer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleWhatsAppReceiver(partial.receiverPhone)
                        }
                      >
                        WhatsApp Receiver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadZebraFile(partial.id)}
                      >
                        Download Zebra Label
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
