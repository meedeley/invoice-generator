"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Copy,
  Search,
  Eye,
  CheckCircle,
} from "lucide-react";
import { getInvoices, getProducts, type Invoice } from "@/lib/data";
import { formatRupiah, generateInvoiceShareUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BuyerAccessProps {
  onBack: () => void;
  initialInvoiceId?: string | null;
}

export function BuyerAccess({ onBack, initialInvoiceId }: BuyerAccessProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<
    string | null
  >(initialInvoiceId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allInvoices, allProducts] = await Promise.all([
          getInvoices(),
          getProducts(),
        ]);
        setInvoices(allInvoices);
        setFilteredInvoices(allInvoices);
        setProducts(allProducts);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setInvoices([]);
        setFilteredInvoices([]);
        setProducts([]);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(invoices);
    } else {
      const filtered = invoices.filter(
        (invoice) =>
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredInvoices(filtered);
    }
  }, [searchTerm, invoices]);

  useEffect(() => {
    if (!loading && highlightedInvoiceId) {
      const element = document.getElementById(
        `invoice-${highlightedInvoiceId}`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [loading, highlightedInvoiceId]);

  const handleCopyLink = async (invoice: Invoice) => {
    const shareUrl = generateInvoiceShareUrl(invoice.id);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInvoiceId(invoice.id);
      setTimeout(() => setCopiedInvoiceId(null), 2000);
      toast({
        title: "Success",
        description: "Invoice link copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                All Invoices
              </CardTitle>
              <CardDescription>
                {highlightedInvoiceId
                  ? `Showing invoice ${highlightedInvoiceId} and all other available invoices`
                  : "View all available invoices"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice ID or buyer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {filteredInvoices.length} invoice(s) matching "
                  {searchTerm}"
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Loading invoices...
              </p>
            </CardContent>
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {searchTerm
                  ? `No invoices found matching "${searchTerm}"`
                  : "No invoices available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                id={`invoice-${invoice.id}`}
                className={
                  highlightedInvoiceId === invoice.id
                    ? "ring-2 ring-primary"
                    : ""
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Invoice Details</span>
                    <div className="flex items-center gap-2">
                      {highlightedInvoiceId === invoice.id && (
                        <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                          Shared Invoice
                        </span>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Invoice Details</DialogTitle>
                            <DialogDescription>
                              Complete invoice information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedInvoice && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Invoice ID
                                  </label>
                                  <p className="font-mono font-medium">
                                    {selectedInvoice.id}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Buyer Name
                                  </label>
                                  <p className="font-medium">
                                    {selectedInvoice.buyer_name}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Date Created
                                  </label>
                                  <p className="font-medium">
                                    {new Date(
                                      selectedInvoice.created_at,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Due Date
                                  </label>
                                  <p className="font-medium">
                                    {new Date(
                                      selectedInvoice.due_date,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Products
                                </label>
                                <div className="mt-2 space-y-2">
                                  {selectedInvoice.products.map(
                                    (item, index) => {
                                      const product = products.find(
                                        (p) => p.id === item.product_id,
                                      );
                                      return (
                                        <div
                                          key={index}
                                          className="flex justify-between items-center p-3 bg-muted rounded-lg"
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {product?.name ||
                                                "Unknown Product"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              Quantity: {item.quantity} ×{" "}
                                              {product
                                                ? formatRupiah(
                                                    product.selling_price,
                                                  )
                                                : formatRupiah(0)}
                                            </p>
                                          </div>
                                          <p className="font-semibold">
                                            {product
                                              ? formatRupiah(
                                                  product.selling_price *
                                                    item.quantity,
                                                )
                                              : formatRupiah(0)}
                                          </p>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                  <label className="text-lg font-medium">
                                    Total Amount
                                  </label>
                                  <p className="text-2xl font-bold text-primary">
                                    {formatRupiah(selectedInvoice.total_amount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(invoice)}
                        className={
                          copiedInvoiceId === invoice.id
                            ? "bg-green-50 border-green-200"
                            : ""
                        }
                      >
                        {copiedInvoiceId === invoice.id ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>Invoice ID: {invoice.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Buyer Name
                      </label>
                      <p className="text-lg font-semibold">
                        {invoice.buyer_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Date Created
                      </label>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Due Date
                      </label>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-lg font-medium flex items-center gap-2">
                        Total Tagihan
                      </label>
                      <p className="text-2xl font-bold text-primary">
                        {formatRupiah(invoice.total_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
