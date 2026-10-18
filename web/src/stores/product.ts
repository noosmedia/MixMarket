// Produkt-Store: welches Produkt in der Recherche gerade gewählt ist.
// Zielgruppen und KI-Bewertungen beziehen sich immer auf dieses Produkt.
// Die Wahl wird im Browser gespeichert und beim nächsten Besuch wiederhergestellt.
import { create } from 'zustand'

const STORAGE_KEY = 'mixmarket-product'

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

interface ProductState {
  productId: string | null
  setProductId: (id: string | null) => void
}

export const useProduct = create<ProductState>((set) => ({
  productId: readStored(),
  setProductId: (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ohne Speicher gilt die Wahl nur für diese Sitzung
    }
    set({ productId: id })
  },
}))
