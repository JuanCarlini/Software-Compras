import { Badge } from "@/views/ui/badge"
import { getStatusStyle } from "./status-colors"

interface StatusBadgeProps {
  estado: string | null | undefined
  showIcon?: boolean
  className?: string
}

/**
 * Badge estandarizado con semaforización automática
 */
export function StatusBadge({ estado, showIcon = false, className = "" }: StatusBadgeProps) {
  const style = getStatusStyle(estado)
  const Icon = style.icon
  
  return (
    <Badge className={`${style.color} ${className}`}>
      <div className="flex items-center space-x-1">
        {showIcon && <Icon className={`h-3.5 w-3.5 ${style.iconColor}`} />}
        <span className="capitalize">{estado || "Sin estado"}</span>
      </div>
    </Badge>
  )
}
