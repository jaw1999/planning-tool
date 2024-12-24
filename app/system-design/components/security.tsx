'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Shield, Lock, Key, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

export function Security() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const securityFeatures = {
    authentication: {
      implemented: [
        "JWT token-based auth",
        "Secure session management",
        "Role-based access control",
        "Token refresh mechanism"
      ],
      planned: [
        "Multi-factor authentication",
        "OAuth integration"
      ]
    },
    dataProtection: {
      implemented: [
        "Encrypted cost data storage",
        "Access control for financial data",
        "Audit logging for modifications"
      ],
      planned: [
        "End-to-end encryption",
        "Advanced audit trails"
      ]
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Implementation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Authentication Section */}
            <section className="relative">
              <div 
                className={`border rounded-lg p-6 transition-all duration-200 ${
                  selectedSection === 'auth' ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSection(selectedSection === 'auth' ? null : 'auth')}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Authentication</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Implementation Status */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <h4 className="font-medium">Implemented Features</h4>
                    </div>
                    <ul className="space-y-2">
                      {securityFeatures.authentication.implemented.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{feature}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Planned Features */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <h4 className="font-medium">Planned Enhancements</h4>
                    </div>
                    <ul className="space-y-2">
                      {securityFeatures.authentication.planned.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{feature}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Data Protection</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Cost Data Security</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Encrypted storage of sensitive cost information</p>
                    <p>• Access control for financial data</p>
                    <p>• Audit logging for cost modifications</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Exercise Data Protection</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Role-based access to exercise details</p>
                    <p>• Secure storage of exercise configurations</p>
                    <p>• Protected system assignments</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Access Control */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Access Control</h3>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Permission Levels</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium">Exercise Management</h5>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>• View exercises</li>
                      <li>• Create/edit exercises</li>
                      <li>• Manage systems</li>
                      <li>• Cost analysis access</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium">System Administration</h5>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>• User management</li>
                      <li>• Role assignment</li>
                      <li>• System configuration</li>
                      <li>• Security settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 