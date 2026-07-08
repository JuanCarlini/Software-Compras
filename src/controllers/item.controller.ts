import { ItemRepository } from "@/repositories/item.repository"
import { Item, CreateItemDTO, UpdateItemDTO } from "@/models"

// Reglas de negocio de items. El I/O vive en ItemRepository (A1); acá quedan el
// default is_active al crear, el dedup/orden de categorías y la lectura de "en uso".
export class ItemService {
  static async getAll(): Promise<Item[]> {
    return ItemRepository.findAllActive()
  }

  static async getAllIncludingInactive(): Promise<Item[]> {
    return ItemRepository.findAll()
  }

  static async search(query: string): Promise<Item[]> {
    return ItemRepository.search(query)
  }

  static async getById(id: number): Promise<Item | null> {
    return ItemRepository.findById(id)
  }

  // S2: is_active y created_by los fija el server (created_by sale del JWT), nunca el cliente.
  static async create(item: Omit<CreateItemDTO, "created_by">, createdBy: number): Promise<Item> {
    return ItemRepository.insert({ ...item, is_active: true, created_by: createdBy })
  }

  static async update(id: number, item: UpdateItemDTO): Promise<Item | null> {
    return ItemRepository.update(id, item)
  }

  // Soft delete: marcar inactivo (reversible con reactivate)
  static async softDelete(id: number): Promise<boolean> {
    return ItemRepository.setActive(id, false)
  }

  static async reactivate(id: number): Promise<boolean> {
    return ItemRepository.setActive(id, true)
  }

  static async isInUse(id: number): Promise<boolean> {
    return ItemRepository.existsInLineasOC(id)
  }

  static async getByCategoria(categoria: string): Promise<Item[]> {
    return ItemRepository.findByCategoria(categoria)
  }

  static async getCategorias(): Promise<string[]> {
    const valores = await ItemRepository.findCategoriaValues()
    // categorías únicas, sin vacíos, ordenadas
    return [...new Set(valores.filter(Boolean) as string[])].sort()
  }
}
