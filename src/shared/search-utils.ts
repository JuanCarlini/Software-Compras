// Función genérica de búsqueda que busca en múltiples campos
export function searchInFields<T>(
  items: T[], 
  searchTerm: string, 
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) {
    return items
  }

  const normalizedSearch = searchTerm.toLowerCase().trim()

  return items.filter(item => {
    return fields.some(field => {
      const value = item[field]
      if (value == null) return false
      
      // Manejar fechas
      if (value instanceof Date) {
        return value.toLocaleDateString().toLowerCase().includes(normalizedSearch)
      }
      
      // Manejar números
      if (typeof value === 'number') {
        return value.toString().toLowerCase().includes(normalizedSearch)
      }
      
      // Manejar strings
      return value.toString().toLowerCase().includes(normalizedSearch)
    })
  })
}

// Función de búsqueda avanzada con múltiples términos
export function advancedSearch<T>(
  items: T[], 
  searchTerm: string, 
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) {
    return items
  }

  // Separar términos por espacios
  const terms = searchTerm.toLowerCase().trim().split(/\s+/)

  return items.filter(item => {
    return terms.every(term => {
      return fields.some(field => {
        const value = item[field]
        if (value == null) return false
        
        const stringValue = value instanceof Date 
          ? value.toLocaleDateString() 
          : value.toString()
        
        return stringValue.toLowerCase().includes(term)
      })
    })
  })
}

// Función de búsqueda con score (relevancia)
export function searchWithScore<T>(
  items: T[], 
  searchTerm: string, 
  fields: (keyof T)[],
  weights?: Partial<Record<keyof T, number>>
): T[] {
  if (!searchTerm.trim()) {
    return items
  }

  const normalizedSearch = searchTerm.toLowerCase().trim()
  const defaultWeight = 1

  const itemsWithScore = items.map(item => {
    let score = 0
    
    fields.forEach(field => {
      const value = item[field]
      const weight = weights?.[field] ?? defaultWeight
      
      if (value != null) {
        const stringValue = value instanceof Date 
          ? value.toLocaleDateString() 
          : value.toString().toLowerCase()
        
        if (stringValue.includes(normalizedSearch)) {
          // Bonus por coincidencia exacta
          if (stringValue === normalizedSearch) {
            score += weight * 10
          }
          // Bonus por empezar con el término
          else if (stringValue.startsWith(normalizedSearch)) {
            score += weight * 5
          }
          // Coincidencia normal
          else {
            score += weight
          }
        }
      }
    })
    
    return { item, score }
  })
  
  return itemsWithScore
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}