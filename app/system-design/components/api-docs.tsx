'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, ChevronUp, Code } from 'lucide-react';
import { Badge } from "@/app/components/ui/badge";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  responseExample?: string;
}

interface EndpointCategory {
  [key: string]: Endpoint[];
}

export function ApiDocs() {
  const [expandedSection, setExpandedSection] = useState<string | null>("auth");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const endpoints: EndpointCategory = {
    auth: [
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user and create session',
        requestBody: `{
  email: string,
  password: string
}`,
        responseExample: `{
  user: {
    id: string,
    name: string,
    email: string,
    role: Role
  },
  token: string
}`
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        description: 'End user session'
      },
      {
        method: 'GET',
        path: '/api/auth/session',
        description: 'Get current user session',
        responseExample: `{
  user: {
    id: string,
    name: string,
    email: string,
    role: Role
  } | null
}`
      },
      {
        method: 'POST',
        path: '/api/auth/reset-password',
        description: 'Reset user password',
        requestBody: `{
  token: string,
  userId: string,
  password: string
}`
      }
    ],
    users: [
      {
        method: 'GET',
        path: '/api/users',
        description: 'List all users',
        responseExample: `Array<{
  id: string,
  name: string,
  email: string,
  role: Role,
  status: UserStatus,
  createdAt: Date,
  updatedAt: Date
}>`
      },
      {
        method: 'POST',
        path: '/api/users',
        description: 'Create new user',
        requestBody: `{
  name: string,
  email: string,
  password: string,
  role: Role,
  status: UserStatus
}`
      },
      {
        method: 'GET',
        path: '/api/users/[id]',
        description: 'Get user details'
      },
      {
        method: 'PATCH',
        path: '/api/users/[id]',
        description: 'Update user information'
      },
      {
        method: 'DELETE',
        path: '/api/users/[id]',
        description: 'Delete user'
      }
    ],
    exercises: [
      {
        method: 'GET',
        path: '/api/exercises',
        description: 'List all exercises',
        responseExample: `Array<{
  id: string,
  name: string,
  description?: string,
  startDate: Date,
  endDate: Date,
  location?: string,
  status: ExerciseStatus,
  systems: Array<ExerciseSystem>
}>`
      },
      {
        method: 'POST',
        path: '/api/exercises',
        description: 'Create new exercise',
        requestBody: `{
  name: string,
  description?: string,
  startDate: Date,
  endDate: Date,
  location?: string,
  status: ExerciseStatus,
  systems: Array<{
    systemId: string,
    quantity: number,
    fsrSupport: FSRType,
    launchesPerDay: number
  }>
}`
      },
      {
        method: 'GET',
        path: '/api/exercises/[id]',
        description: 'Get exercise details'
      },
      {
        method: 'PUT',
        path: '/api/exercises/[id]',
        description: 'Update exercise'
      },
      {
        method: 'DELETE',
        path: '/api/exercises/[id]',
        description: 'Delete exercise'
      }
    ],
    systems: [
      {
        method: 'GET',
        path: '/api/systems',
        description: 'List all systems',
        responseExample: `Array<{
  id: string,
  name: string,
  description?: string,
  basePrice: number,
  hasLicensing: boolean,
  licensePrice?: number,
  leadTime: number,
  specifications?: Record<string, any>,
  consumablesRate?: number
}>`
      },
      {
        method: 'POST',
        path: '/api/systems',
        description: 'Create new system',
        requestBody: `{
  name: string,
  description?: string,
  basePrice: number,
  hasLicensing: boolean,
  licensePrice?: number,
  leadTime: number,
  specifications?: Record<string, any>,
  consumablesRate?: number
}`
      }
    ],
    analytics: [
      {
        method: 'GET',
        path: '/api/analytics',
        description: 'Get system analytics and statistics',
        responseExample: `{
  activeExercises: number,
  systemsInUse: number,
  utilization: number,
  monthlyAverage: number,
  monthlyChange: number,
  yearlyChange: number,
  monthlyCosts: Array<{
    month: string,
    total: number
  }>,
  systemUsage: Record<string, number>,
  costBreakdown: {
    hardware: number,
    licensing: number,
    consumables: number,
    fsr: number
  }
}`
      }
    ],
    database: [
      {
        method: 'GET',
        path: '/api/database/health',
        description: 'Check database health status'
      },
      {
        method: 'POST',
        path: '/api/database/backup',
        description: 'Create database backup'
      },
      {
        method: 'POST',
        path: '/api/database/restore',
        description: 'Restore database from backup'
      },
      {
        method: 'GET',
        path: '/api/database/stats',
        description: 'Get database statistics and metrics'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(endpoints).map(([category, categoryEndpoints]) => (
              <section key={category}>
                <Button
                  variant="ghost"
                  className="w-full flex justify-between items-center"
                  onClick={() => toggleSection(category)}
                >
                  <h3 className="text-lg font-semibold capitalize">{category} API</h3>
                  {expandedSection === category ? <ChevronUp /> : <ChevronDown />}
                </Button>

                {expandedSection === category && (
                  <div className="mt-4 space-y-4">
                    {categoryEndpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-colors ${
                          selectedEndpoint === `${category}-${index}` ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedEndpoint(`${category}-${index}`)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                            {endpoint.method}
                          </Badge>
                          <h4 className="font-medium text-primary">{endpoint.path}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {endpoint.description}
                        </p>
                        {endpoint.requestBody && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium">Request Body:</h5>
                            <pre className="text-sm bg-muted p-2 rounded mt-2">
                              {endpoint.requestBody}
                            </pre>
                          </div>
                        )}
                        {endpoint.responseExample && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium">Response:</h5>
                            <pre className="text-sm bg-muted p-2 rounded mt-2">
                              {endpoint.responseExample}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 