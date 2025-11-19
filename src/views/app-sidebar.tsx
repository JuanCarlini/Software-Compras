"use client"

import { BarChart3, Building2, CreditCard, Settings, ShoppingCart, Home, FileCheck, Receipt } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/views/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Órdenes de Compra",
    url: "/ordenes-compra",
    icon: ShoppingCart,
  },
  {
    title: "Certificaciones",
    url: "/certificaciones",
    icon: FileCheck,
  },
  {
    title: "Facturas",
    url: "/facturas",
    icon: Receipt,
  },
  {
    title: "Órdenes de Pago",
    url: "/ordenes-pago",
    icon: CreditCard,
  },
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Building2,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    url: "/configuración",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-slate-200">
      <SidebarHeader className="border-b border-slate-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G1</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Gestión Uno</h2>
            <p className="text-xs text-slate-600">Sistema de Gestión</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`text-slate-700 hover:bg-slate-100 hover:text-slate-900 ${
                        isActive ? "bg-slate-100 text-slate-900 font-medium" : ""
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
