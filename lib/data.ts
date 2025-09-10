export interface Product {
  id: string
  name: string
  cost_price: number
  selling_price: number
}

export interface InvoiceItem {
  product_id: string
  quantity: number
}

export interface Invoice {
  id: string
  buyer_name: string
  products: InvoiceItem[]
  total_amount: number
  created_at: string
  due_date: string
}

export interface WhatsAppContact {
  id: string
  name: string
  phone: string
  created_at: string
}

const STORAGE_KEY = "invoice_generator_data"

const loadData = async (): Promise<{ products: Product[]; invoices: Invoice[]; contacts: WhatsAppContact[] }> => {
  try {
    const response = await fetch("/api/data")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return {
      products: Array.isArray(data.products) ? data.products : [],
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
    }
  } catch (error) {
    console.error("Error loading data from JSON file:", error)
    return { products: [], invoices: [], contacts: [] }
  }
}

const saveData = async (data: {
  products: Product[]
  invoices: Invoice[]
  contacts: WhatsAppContact[]
}): Promise<boolean> => {
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error saving data to JSON file:", error)
    return false
  }
}

export const getProducts = async (): Promise<Product[]> => {
  const data = await loadData()
  return data.products
}

export const addProduct = async (product: Omit<Product, "id">): Promise<Product> => {
  const data = await loadData()

  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
  }

  data.products.push(newProduct)
  await saveData(data)
  return newProduct
}

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  const data = await loadData()

  const index = data.products.findIndex((p) => p.id === id)
  if (index === -1) return null

  data.products[index] = { ...data.products[index], ...updates }
  await saveData(data)
  return data.products[index]
}

export const deleteProduct = async (id: string): Promise<boolean> => {
  const data = await loadData()

  const index = data.products.findIndex((p) => p.id === id)
  if (index === -1) return false

  data.products.splice(index, 1)
  await saveData(data)
  return true
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const data = await loadData()
  return data.invoices
}

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  const data = await loadData()
  return data.invoices.find((invoice) => invoice.id === id) || null
}

export const addInvoice = async (
  invoice: Omit<Invoice, "id" | "total_amount" | "created_at"> & {
    invoice_date?: string
    due_date: string
  },
): Promise<Invoice> => {
  const data = await loadData()

  // Calculate total amount
  const total_amount = invoice.products.reduce((total: number, item: InvoiceItem) => {
    const product = data.products.find((p) => p.id === item.product_id)
    return total + (product ? product.selling_price * item.quantity : 0)
  }, 0)

  const newInvoice: Invoice = {
    buyer_name: invoice.buyer_name,
    products: invoice.products,
    due_date: invoice.due_date,
    id: `INV-${Date.now()}`,
    total_amount,
    created_at: invoice.invoice_date || new Date().toISOString(),
  }

  data.invoices.push(newInvoice)
  await saveData(data)
  return newInvoice
}

export const deleteInvoice = async (id: string): Promise<boolean> => {
  const data = await loadData()

  const index = data.invoices.findIndex((invoice) => invoice.id === id)
  if (index === -1) return false

  data.invoices.splice(index, 1)
  await saveData(data)
  return true
}

export const generateReport = async () => {
  const data = await loadData()

  const totalRevenue = data.invoices.reduce((sum: number, invoice: Invoice) => sum + invoice.total_amount, 0)

  const totalCost = data.invoices.reduce((sum: number, invoice: Invoice) => {
    return (
      sum +
      invoice.products.reduce((invoiceSum: number, item: InvoiceItem) => {
        const product = data.products.find((p) => p.id === item.product_id)
        return invoiceSum + (product ? product.cost_price * item.quantity : 0)
      }, 0)
    )
  }, 0)

  const profit = totalRevenue - totalCost

  return {
    totalRevenue,
    totalCost,
    profit,
  }
}

export const exportData = async (): Promise<string> => {
  const data = await loadData()
  const exportData = {
    ...data,
    exportDate: new Date().toISOString(),
  }
  return JSON.stringify(exportData, null, 2)
}

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const importedData = JSON.parse(jsonData)
    const data = await loadData()

    if (importedData.products && Array.isArray(importedData.products)) {
      data.products = importedData.products
    }
    if (importedData.invoices && Array.isArray(importedData.invoices)) {
      data.invoices = importedData.invoices
    }
    if (importedData.contacts && Array.isArray(importedData.contacts)) {
      data.contacts = importedData.contacts
    }

    return await saveData(data)
  } catch (error) {
    console.error("Error importing data:", error)
    return false
  }
}

export const getContacts = async (): Promise<WhatsAppContact[]> => {
  const data = await loadData()
  return data.contacts
}

export const addContact = async (contact: Omit<WhatsAppContact, "id" | "created_at">): Promise<WhatsAppContact> => {
  const data = await loadData()

  const newContact: WhatsAppContact = {
    ...contact,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  }

  data.contacts.push(newContact)
  await saveData(data)
  return newContact
}

export const updateContact = async (id: string, updates: Partial<WhatsAppContact>): Promise<WhatsAppContact | null> => {
  const data = await loadData()

  const index = data.contacts.findIndex((c) => c.id === id)
  if (index === -1) return null

  data.contacts[index] = { ...data.contacts[index], ...updates }
  await saveData(data)
  return data.contacts[index]
}

export const deleteContact = async (id: string): Promise<boolean> => {
  const data = await loadData()

  const index = data.contacts.findIndex((c) => c.id === id)
  if (index === -1) return false

  data.contacts.splice(index, 1)
  await saveData(data)
  return true
}

export const clearAllData = async (): Promise<boolean> => {
  return await saveData({ products: [], invoices: [], contacts: [] })
}
