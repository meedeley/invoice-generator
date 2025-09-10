import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateInvoiceShareUrl(invoiceId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}?invoice=${invoiceId}`
  }
  return `#invoice-${invoiceId}`
}

export function generateInvoiceEmailContent(invoice: any, products: any[]): string {
  const subject = `Invoice ${invoice.id} - ${invoice.buyer_name}`
  const shareUrl = generateInvoiceShareUrl(invoice.id)

  const productList = invoice.products
    .map((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id)
      return `- ${product?.name || "Unknown"} x${item.quantity} = ${formatRupiah((product?.selling_price || 0) * item.quantity)}`
    })
    .join("\n")

  const body = `Halo ${invoice.buyer_name},

Berikut adalah invoice Anda:

Invoice ID: ${invoice.id}
Tanggal: ${new Date(invoice.created_at).toLocaleDateString("id-ID")}

Produk:
${productList}

Total: ${formatRupiah(invoice.total_amount)}

Anda dapat melihat invoice lengkap di: ${shareUrl}

Terima kasih!`

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function generateInvoiceWhatsAppContent(invoice: any, products: any[], phoneNumber?: string): string {
  const shareUrl = generateInvoiceShareUrl(invoice.id)

  const productList = invoice.products
    .map((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id)
      return `- ${product?.name || "Unknown"} x${item.quantity} = ${formatRupiah((product?.selling_price || 0) * item.quantity)}`
    })
    .join("\n")

  const message = `Invoice ${invoice.id}

Buyer: ${invoice.buyer_name}
Tanggal: ${new Date(invoice.created_at).toLocaleDateString("id-ID")}
Jatuh Tempo: ${new Date(invoice.due_date).toLocaleDateString("id-ID")}

Produk:
${productList}

Total: ${formatRupiah(invoice.total_amount)}

Lihat invoice lengkap: ${shareUrl}

Terima kasih!`

  const baseUrl = phoneNumber ? `https://wa.me/${phoneNumber}` : `https://wa.me/`
  return `${baseUrl}?text=${encodeURIComponent(message)}`
}
