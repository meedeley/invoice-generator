"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Calendar, DollarSign, User, Package, Trash2, Mail, MessageCircle } from "lucide-react"
import {
  getProducts,
  getInvoices,
  addInvoice,
  deleteInvoice,
  getContacts,
  type Product,
  type Invoice,
  type InvoiceItem,
  type WhatsAppContact,
} from "@/lib/data"
import { useToast } from "@/hooks/use-toast"
import { formatRupiah, generateInvoiceEmailContent, generateInvoiceWhatsAppContent } from "@/lib/utils"

export function InvoiceManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [whatsappInvoice, setWhatsappInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [buyerName, setBuyerName] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<InvoiceItem[]>([])
  const [invoiceDate, setInvoiceDate] = useState("")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [productsData, invoicesData, contactsData] = await Promise.all([
          getProducts(),
          getInvoices(),
          getContacts(),
        ])
        setProducts(productsData)
        setInvoices(invoicesData)
        setWhatsappContacts(contactsData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toast])

  const resetForm = () => {
    setBuyerName("")
    setSelectedProducts([])
    setInvoiceDate("")
    setDueDate("")
  }

  const addProductToInvoice = () => {
    setSelectedProducts([...selectedProducts, { product_id: "", quantity: 1 }])
  }

  const updateProductInInvoice = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...selectedProducts]
    if (field === "quantity") {
      updated[index][field] = Number(value)
    } else {
      updated[index][field] = value as string
    }
    setSelectedProducts(updated)
  }

  const removeProductFromInvoice = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
  }

  const calculateInvoiceTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id)
      return total + (product ? product.selling_price * item.quantity : 0)
    }, 0)
  }

  const handleCreateInvoice = async () => {
    if (!buyerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter buyer name",
        variant: "destructive",
      })
      return
    }

    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please select due date",
        variant: "destructive",
      })
      return
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      })
      return
    }

    for (let i = 0; i < selectedProducts.length; i++) {
      const item = selectedProducts[i]
      if (!item.product_id) {
        toast({
          title: "Error",
          description: `Please select a product for item ${i + 1}`,
          variant: "destructive",
        })
        return
      }
      if (item.quantity <= 0) {
        toast({
          title: "Error",
          description: `Please enter a valid quantity for item ${i + 1}`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      const newInvoice = await addInvoice({
        buyer_name: buyerName.trim(),
        products: selectedProducts,
        invoice_date: invoiceDate || new Date().toISOString(),
        due_date: new Date(dueDate).toISOString(),
      })

      const updatedInvoices = await getInvoices()
      setInvoices(updatedInvoices)
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: `Invoice ${newInvoice.id} created for ${newInvoice.buyer_name}`,
      })
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openViewDialog = (invoice: Invoice) => {
    setViewingInvoice(invoice)
    setIsViewDialogOpen(true)
  }

  const openWhatsAppDialog = async (invoice: Invoice) => {
    setWhatsappInvoice(invoice)
    setIsWhatsAppDialogOpen(true)
    try {
      const contactsData = await getContacts()
      setWhatsappContacts(contactsData)
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.name : "Unknown Product"
  }

  const getProductPrice = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.selling_price : 0
  }

  const handleEmailInvoice = (invoice: Invoice) => {
    const emailUrl = generateInvoiceEmailContent(invoice, products)
    window.location.href = emailUrl
  }

  const handleWhatsAppToContact = (invoice: Invoice, contact: WhatsAppContact) => {
    const whatsappUrl = generateInvoiceWhatsAppContent(invoice, products, contact.phone)
    window.open(whatsappUrl, "_blank")
    setIsWhatsAppDialogOpen(false)
    toast({
      title: "Success",
      description: `WhatsApp opened for ${contact.name}`,
    })
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await deleteInvoice(invoiceId)
      const updatedInvoices = await getInvoices()
      setInvoices(updatedInvoices)
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Invoice Management</h2>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-muted-foreground">Create and manage invoices for your buyers</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Generate an invoice for a buyer with selected products</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="buyer-name">Buyer Name</Label>
                <Input
                  id="buyer-name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter buyer's full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice-date">Invoice Date (Optional)</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty to use current date</p>
                </div>
                <div>
                  <Label htmlFor="due-date">Due Date *</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Products</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addProductToInvoice}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Product
                  </Button>
                </div>

                {selectedProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No products added. Click "Add Product" to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateProductInInvoice(index, "product_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {formatRupiah(product.selling_price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateProductInInvoice(index, "quantity", e.target.value)}
                            placeholder="Qty"
                          />
                        </div>
                        <div className="w-20 text-right font-medium">
                          {formatRupiah(getProductPrice(item.product_id) * item.quantity)}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeProductFromInvoice(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedProducts.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-xl font-bold">{formatRupiah(calculateInvoiceTotal())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice}>Create Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
          <CardDescription>All generated invoices and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices found. Create your first invoice to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">{invoice.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {invoice.buyer_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <Badge variant="secondary">{invoice.products.length} items</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="w-4 h-4" />
                        {formatRupiah(invoice.total_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEmailInvoice(invoice)}>
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openWhatsAppDialog(invoice)}>
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openViewDialog(invoice)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete invoice {invoice.id}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {viewingInvoice && `Invoice ${viewingInvoice.id} for ${viewingInvoice.buyer_name}`}
            </DialogDescription>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Invoice ID</Label>
                  <p className="font-mono font-medium">{viewingInvoice.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date Created</Label>
                  <p className="font-medium">{new Date(viewingInvoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Buyer Name</Label>
                  <p className="font-medium">{viewingInvoice.buyer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <p className="text-xl font-bold">{formatRupiah(viewingInvoice.total_amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{new Date(viewingInvoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Products</Label>
                <div className="mt-2 space-y-2">
                  {viewingInvoice.products.map((item, index) => {
                    const product = products.find((p) => p.id === item.product_id)
                    return (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{getProductName(item.product_id)}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × {formatRupiah(getProductPrice(item.product_id))}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatRupiah(getProductPrice(item.product_id) * item.quantity)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewingInvoice && (
              <>
                <Button variant="outline" onClick={() => handleEmailInvoice(viewingInvoice)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" onClick={() => openWhatsAppDialog(viewingInvoice)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send via WhatsApp</DialogTitle>
            <DialogDescription>
              {whatsappInvoice && `Select a contact to send invoice ${whatsappInvoice.id}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {whatsappContacts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No WhatsApp contacts found.</p>
                <p className="text-sm text-muted-foreground">Add contacts in the WhatsApp Contacts menu first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {whatsappContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => whatsappInvoice && handleWhatsAppToContact(whatsappInvoice, contact)}
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">+{contact.phone}</p>
                    </div>
                    <MessageCircle className="w-4 h-4" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWhatsAppDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
