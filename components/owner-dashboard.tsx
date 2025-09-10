"use client";
import { Button } from "@/components/ui/button";
import type React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut,
  Package,
  FileText,
  BarChart3,
  Download,
  Upload,
  MessageCircle,
} from "lucide-react";
import { ProductManagement } from "@/components/product-management";
import { InvoiceManagement } from "@/components/invoice-management";
import { ReportsView } from "@/components/reports-view";
import { WhatsAppContacts } from "@/components/whatsapp-contacts";
import { exportData, importData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

interface OwnerDashboardProps {
  onLogout: () => void;
}

export function OwnerDashboard({ onLogout }: OwnerDashboardProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    try {
      const jsonData = await exportData();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description:
          "Invoice data has been exported to JSON file successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
      });
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importData(text);

      if (success) {
        toast({
          title: "Data Imported",
          description: "Invoice data has been imported successfully.",
        });
        window.location.reload();
      } else {
        throw new Error("Import failed");
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description:
          "Failed to import data. Please check the JSON file format.",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoice Generator Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportData}>
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: "none" }}
      />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <InvoiceManagement />
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <WhatsAppContacts />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
