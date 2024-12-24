'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { DataFlow } from "./components/data-flow";
import { ApiDocs } from "./components/api-docs";
import { DatabaseSchema } from "./components/database-schema";
import { Workflows } from "./components/workflows";
import { Security } from "./components/security";
import { Architecture } from "./components/architecture";

export default function SystemDesignPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <Tabs defaultValue="architecture" className="space-y-4">
        <TabsList className="grid grid-cols-6 gap-4">
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="dataflow">Data Flow</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-4">
          <Architecture />
        </TabsContent>
        <TabsContent value="dataflow" className="space-y-4">
          <DataFlow />
        </TabsContent>
        <TabsContent value="api" className="space-y-4">
          <ApiDocs />
        </TabsContent>
        <TabsContent value="database" className="space-y-4">
          <DatabaseSchema />
        </TabsContent>
        <TabsContent value="workflows" className="space-y-4">
          <Workflows />
        </TabsContent>
        <TabsContent value="security" className="space-y-4">
          <Security />
        </TabsContent>
      </Tabs>
    </div>
  );
}