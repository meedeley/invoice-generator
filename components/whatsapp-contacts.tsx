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
import { Plus, Trash2, MessageCircle, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getContacts, addContact, updateContact, deleteContact, type WhatsAppContact } from "@/lib/data"

export function WhatsAppContacts() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<WhatsAppContact | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const contactsData = await getContacts()
      setContacts(contactsData)
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setPhone("")
    setEditingContact(null)
  }

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "")

    // If starts with 0, replace with 62
    if (cleaned.startsWith("0")) {
      return "62" + cleaned.substring(1)
    }

    // If doesn't start with 62, add it
    if (!cleaned.startsWith("62")) {
      return "62" + cleaned
    }

    return cleaned
  }

  const handleCreateContact = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const formattedPhone = formatPhoneNumber(phone)
      const newContact = await addContact({
        name: name.trim(),
        phone: formattedPhone,
      })

      setContacts([...contacts, newContact])
      setIsCreateDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: `Contact ${newContact.name} added successfully`,
      })
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive",
      })
    }
  }

  const handleEditContact = async () => {
    if (!name.trim() || !phone.trim() || !editingContact) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const formattedPhone = formatPhoneNumber(phone)
      const updatedContact = await updateContact(editingContact.id, {
        name: name.trim(),
        phone: formattedPhone,
      })

      if (updatedContact) {
        setContacts(contacts.map((contact) => (contact.id === editingContact.id ? updatedContact : contact)))
        setIsEditDialogOpen(false)
        resetForm()

        toast({
          title: "Success",
          description: `Contact updated successfully`,
        })
      }
    } catch (error) {
      console.error("Error updating contact:", error)
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      const success = await deleteContact(contactId)
      if (success) {
        setContacts(contacts.filter((contact) => contact.id !== contactId))
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (contact: WhatsAppContact) => {
    setEditingContact(contact)
    setName(contact.name)
    setPhone(contact.phone)
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">WhatsApp Contacts</h2>
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp Contacts</h2>
          <p className="text-muted-foreground">Manage your WhatsApp contacts for invoice sharing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add WhatsApp Contact</DialogTitle>
              <DialogDescription>Add a new contact for sending invoices via WhatsApp</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-name">Contact Name</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone">Phone Number</Label>
                <Input
                  id="contact-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789 or 628123456789"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter phone number with country code (62) or starting with 0
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContact}>Add Contact</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contacts ({contacts.length})</CardTitle>
          <CardDescription>Your WhatsApp contacts for invoice sharing</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No WhatsApp contacts found. Add your first contact to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="font-mono">+{contact.phone}</TableCell>
                    <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(contact)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
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
                              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {contact.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit WhatsApp Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-contact-name">Contact Name</Label>
              <Input
                id="edit-contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <Label htmlFor="edit-contact-phone">Phone Number</Label>
              <Input
                id="edit-contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789 or 628123456789"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter phone number with country code (62) or starting with 0
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditContact}>Update Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export async function getWhatsAppContacts(): Promise<WhatsAppContact[]> {
  try {
    return await getContacts()
  } catch (error) {
    console.error("Error getting WhatsApp contacts:", error)
    return []
  }
}
