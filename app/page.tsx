"use client";

import type React from "react";

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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OwnerDashboard } from "@/components/owner-dashboard";
import { BuyerAccess } from "@/components/buyer-access";

export default function HomePage() {
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [showBuyerAccess, setShowBuyerAccess] = useState(false);
  const [initialInvoiceId, setInitialInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const invoiceId = urlParams.get("invoice");
      if (invoiceId) {
        setInitialInvoiceId(invoiceId);
        setShowBuyerAccess(true);
      }
    }
  }, []);

  const handleOwnerLogin = (username: string, password: string) => {
    const validCredentials = { username: "admin", password: "password" };

    if (
      username === validCredentials.username &&
      password === validCredentials.password
    ) {
      setIsOwnerLoggedIn(true);
      toast({
        title: "Login Successful",
        description: "Welcome to your invoice dashboard!",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
      });
    }
  };

  if (isOwnerLoggedIn) {
    return <OwnerDashboard onLogout={() => setIsOwnerLoggedIn(false)} />;
  }

  if (showBuyerAccess) {
    return (
      <BuyerAccess
        onBack={() => {
          setShowBuyerAccess(false);
          setInitialInvoiceId(null);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }}
        initialInvoiceId={initialInvoiceId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Dinasti Bumbu</CardTitle>
          <CardDescription>
            Manage your products and invoices efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="owner">Owner Login</TabsTrigger>
              <TabsTrigger value="buyer">Buyer Access</TabsTrigger>
            </TabsList>

            <TabsContent value="owner" className="space-y-4">
              <OwnerLoginForm onLogin={handleOwnerLogin} />
            </TabsContent>

            <TabsContent value="buyer" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  View all available invoices without creating an account
                </p>
                <Button
                  onClick={() => setShowBuyerAccess(true)}
                  className="w-full"
                >
                  View Invoices
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function OwnerLoginForm({
  onLogin,
}: {
  onLogin: (username: string, password: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Login as Owner
      </Button>
    </form>
  );
}
