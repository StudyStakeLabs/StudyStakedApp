/**
 * Predefined charity organizations for stake donations
 */

export interface Charity {
  id: string
  name: string
  description: string
  walletAddress: string
  category: "education" | "health" | "environment" | "humanitarian"
  website?: string
}

// NOTE: Replace these with real IOTA testnet addresses for testing
// and real mainnet addresses for production
export const CHARITIES: Charity[] = [
  {
    id: "education-fund",
    name: "Global Education Fund",
    description: "Providing educational resources to underserved communities worldwide",
    walletAddress: "0x1234567890123456789012345678901234567890123456789012345678901234", // Dummy Testnet Address
    category: "education",
    website: "https://example.org/education",
  },
  {
    id: "clean-water",
    name: "Clean Water Initiative",
    description: "Building wells and water purification systems in developing nations",
    walletAddress: "0x2345678901234567890123456789012345678901234567890123456789012345", // Dummy Testnet Address
    category: "humanitarian",
    website: "https://example.org/water",
  },
  {
    id: "climate-action",
    name: "Climate Action Now",
    description: "Fighting climate change through reforestation and renewable energy",
    walletAddress: "0x3456789012345678901234567890123456789012345678901234567890123456", // Dummy Testnet Address
    category: "environment",
    website: "https://example.org/climate",
  },
  {
    id: "medical-aid",
    name: "Medical Aid International",
    description: "Providing medical care and supplies to crisis regions",
    walletAddress: "0x4567890123456789012345678901234567890123456789012345678901234567", // Dummy Testnet Address
    category: "health",
    website: "https://example.org/medical",
  },
  {
    id: "hunger-relief",
    name: "World Hunger Relief",
    description: "Combating food insecurity and malnutrition globally",
    walletAddress: "0x5678901234567890123456789012345678901234567890123456789012345678", // Dummy Testnet Address
    category: "humanitarian",
    website: "https://example.org/hunger",
  },
]

export const getCharityById = (id: string): Charity | undefined => {
  return CHARITIES.find(charity => charity.id === id)
}

export const getCharitiesByCategory = (category: Charity["category"]): Charity[] => {
  return CHARITIES.filter(charity => charity.category === category)
}
