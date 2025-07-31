import { SidebarProvider, SidebarTrigger } from "@/views/ui/sidebar"
import { AppSidebar } from "@/views/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
          <SidebarTrigger />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">Usuario: Admin</span>
          </div>
        </header>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
