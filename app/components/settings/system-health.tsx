import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Activity, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';

interface HealthCheck {
  name: string;
  status: 'success' | 'warning' | 'error' | 'running';
  message: string;
  recommendation?: string;
}

export function SystemHealth() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [running, setRunning] = useState(false);

  const runHealthCheck = async () => {
    setRunning(true);
    setChecks([]);
    
    const initialChecks: HealthCheck[] = [
      { name: 'Database Connection', status: 'running', message: 'Checking connection...' },
      { name: 'Data Integrity', status: 'running', message: 'Scanning data...' },
      { name: 'Storage Space', status: 'running', message: 'Analyzing storage...' },
      { name: 'Backup Status', status: 'running', message: 'Checking backups...' }
    ];
    setChecks(initialChecks);

    try {
      console.log('Initiating health check...');
      const response = await axios.post('/api/system/health-check');
      console.log('Health check response:', response.data);
      setChecks(response.data.checks);
    } catch (error) {
      console.error('Health check error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = axios.isAxiosError(error) 
        ? error.response?.data?.details 
        : 'Please try again or contact support';
      
      setChecks(prev => prev.map(check => ({
        ...check,
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
        recommendation: errorDetails
      })));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={runHealthCheck}
            disabled={running}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Run Health Check
              </>
            )}
          </Button>

          {checks.length > 0 && (
            <div className="space-y-3">
              {checks.map((check, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    check.status === 'success' ? 'bg-green-950/10 border-green-500/20' :
                    check.status === 'warning' ? 'bg-yellow-950/10 border-yellow-500/20' :
                    check.status === 'error' ? 'bg-red-950/10 border-red-500/20' :
                    'bg-gray-950/10 border-gray-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium flex items-center gap-2">
                      {check.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {check.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {check.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                      {check.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {check.name}
                    </h3>
                    <span className={`text-sm ${
                      check.status === 'success' ? 'text-green-500' :
                      check.status === 'warning' ? 'text-yellow-500' :
                      check.status === 'error' ? 'text-red-500' :
                      'text-gray-500'
                    }`}>
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                  {check.recommendation && (
                    <p className="text-sm text-blue-400 mt-1">
                      Recommendation: {check.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 