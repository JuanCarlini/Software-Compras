"use client"

import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"

interface QuickFilter {
  label: string
  value: string
  count?: number
}

interface QuickFiltersProps {
  filters: QuickFilter[]
  activeFilter?: string
  onFilterChange: (value: string) => void
  className?: string
}

export function QuickFilters({ 
  filters, 
  activeFilter, 
  onFilterChange,
  className = ""
}: QuickFiltersProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button
        variant={!activeFilter ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("")}
        className="h-8"
      >
        Todos
      </Button>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className="h-8 gap-1"
        >
          {filter.label}
          {filter.count !== undefined && (
            <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  )
}
