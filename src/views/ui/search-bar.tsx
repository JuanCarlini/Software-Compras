"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/views/ui/input"
import { Button } from "@/views/ui/button"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Buscar...", 
  className = "" 
}: SearchBarProps) {
  const handleClear = () => {
    onChange("")
  }

  return (
    <div className={`relative max-w-sm ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-slate-400" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}