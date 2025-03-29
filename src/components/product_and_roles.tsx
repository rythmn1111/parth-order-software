// src/app/dashboard/page.tsx
"use client";

// import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/products-tab";
import { CustomerRolesTab } from "@/components/customer-roles-tab";
import { SalesStaffTab } from "@/components/sales-staff-tab";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customer_roles">Customer Roles</TabsTrigger>
          <TabsTrigger value="sales_staff">Sales Staff</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        
        <TabsContent value="customer_roles">
          <CustomerRolesTab />
        </TabsContent>
        
        <TabsContent value="sales_staff">
          <SalesStaffTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}