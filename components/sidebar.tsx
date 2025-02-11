"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Users, Truck, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    label: "New Shipment",
    icon: PlusCircle,
    href: "/new-shipment",
  },
  {
    label: "Closed Shipments",
    icon: Truck,
    href: "/shipments/closed",
  },
  {
    label: "Customers",
    icon: Users,
    href: "/customers",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-gray-100 text-gray-800">
      <div className="px-3 py-2 flex-1">
        <Link href="/" className="flex items-center pl-3 mb-14">
          <Package className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold ml-2">ShipMaster</span>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname === route.href ? "text-primary bg-primary/10" : "text-gray-600",
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon
                  className={cn("h-5 w-5 mr-3", pathname === route.href ? "text-primary" : "text-gray-500")}
                />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

