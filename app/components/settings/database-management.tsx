import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Database, RefreshCw, AlertCircle, HardDrive, Clock, Users, Activity, Server, Loader2, Cpu } from 'lucide-react';
import { MemoryStick as Memory } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import axios from 'axios';
import { StatusCard } from './status-card';
import { ResourceMeter } from './resource-meter';
import { toast } from '@/app/components/ui/use-toast';
import { Button } from '../ui/button';

interface DatabaseStats {
  totalUsers: number;
  totalSystems: number;
  lastBackup: string | null;
  databaseSize: string;
  uptime: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface DetailedDatabaseStats extends DatabaseStats {
  systemMetrics: {
    cpu: {
      usage: string;
      cores: number;
      load: string;
      details: Array<{
        model: string;
        speed: number;
        times: {
          user: number;
          nice: number;
          sys: number;
          idle: number;
          irq: number;
        }
      }>;
    };
    memory: {
      usage: string;
      total: number;
      free: number;
      details: {
        buffers: number;
        cached: number;
        active: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
    };
    api: {
      requestsPerMinute: number;
      avgResponseTime: string;
      activeConnections: number;
    };
  };
  databaseSizeBytes: number;
}

interface MetricHistory {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  apiCalls: number;
}

interface DatabaseManagementProps {
  onExport: () => Promise<void>;
  onBackup?: () => Promise<void>;
  onRestore?: (file: File) => Promise<void>;
}

export function DatabaseManagement({ onExport, onBackup, onRestore }: DatabaseManagementProps) {
  const [stats, setStats] = useState<DetailedDatabaseStats | null>(null);
  const [metricHistory, setMetricHistory] = useState<MetricHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulated API call - replace with actual endpoint
        const response = await axios.get('/api/database/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch database stats:', error);
      }
    };

    const fetchMetrics = async () => {
      try {
        // Simulated API call - replace with actual endpoint
        const response = await axios.get('/api/database/metrics');
        setMetricHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchMetrics();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/database/health');
      const isConnected = response.data.status === 'connected';
      
      setStats(prev => prev ? {
        ...prev,
        status: isConnected ? 'connected' : 'error'
      } : null);

      if (!isConnected) {
        toast({
          title: 'Database Connection Error',
          description: 'Unable to establish database connection',
          variant: 'error'
        });
      }
      
      return isConnected;
    } catch (error) {
      console.error('Database connection check failed:', error);
      setStats(prev => prev ? { ...prev, status: 'error' } : null);
      
      toast({
        title: 'Connection Error',
        description: 'Failed to check database connection',
        variant: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number | undefined): string => {
    if (bytes === undefined || bytes === null) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatusCard
              icon={Server}
              title="Database Status"
              value={stats?.status || 'Loading...'}
              status={stats?.status || 'loading'}
            />
            <StatusCard
              icon={Users}
              title="Total Users"
              value={stats?.totalUsers.toString() || '0'}
              status="info"
            />
            <StatusCard
              icon={HardDrive}
              title="Database Size"
              value={stats?.databaseSize || '0 MB'}
              status="info"
            />
            <StatusCard
              icon={Clock}
              title="Uptime"
              value={stats?.uptime || '0:00:00'}
              status="info"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ResourceMeter
              title="CPU Usage"
              value={parseInt(stats?.systemMetrics.cpu.usage || '0')}
              max={100}
              unit="%"
            />
            <ResourceMeter
              title="Memory Usage"
              value={parseInt(stats?.systemMetrics.memory.usage || '0')}
              max={100}
              unit="%"
            />
            <ResourceMeter
              title="API Load"
              value={stats?.systemMetrics.api.requestsPerMinute || 0}
              max={1000}
              unit="req/min"
            />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    CPU Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span>{stats?.systemMetrics.cpu.details?.[0]?.model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cores:</span>
                      <span>{stats?.systemMetrics.cpu.cores || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Load Average:</span>
                      <span>{stats?.systemMetrics.cpu.load || '0, 0, 0'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Memory className="h-5 w-5" />
                    Memory Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span>{formatBytes(stats?.systemMetrics?.memory?.total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used:</span>
                      <span>{formatBytes((stats?.systemMetrics?.memory?.total || 0) - (stats?.systemMetrics?.memory?.free || 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free:</span>
                      <span>{formatBytes(stats?.systemMetrics?.memory?.free || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heap Used:</span>
                      <span>{formatBytes(stats?.systemMetrics?.memory?.details?.heapUsed || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heap Total:</span>
                      <span>{formatBytes(stats?.systemMetrics?.memory?.details?.heapTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cached:</span>
                      <span>{formatBytes(stats?.systemMetrics?.memory?.details?.cached || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} 
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                    formatter={(value, name) => {
                      if (name === 'API Calls/min') return [value, name];
                      return [`${value}%`, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="cpuUsage" 
                    stroke="#8884d8" 
                    name="CPU Usage %" 
                    dot={false}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="memoryUsage" 
                    stroke="#82ca9d" 
                    name="Memory Usage %" 
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="apiCalls" 
                    stroke="#ffc658" 
                    name="API Calls/min" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={onExport}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Export Data
            </Button>
            {onBackup && (
              <Button
                onClick={onBackup}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <HardDrive className="h-4 w-4 mr-2" />
                )}
                Create Backup
              </Button>
            )}
            {onRestore && (
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.sql,.dump';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) onRestore(file);
                  };
                  input.click();
                }}
                className="bg-yellow-600 hover:bg-yellow-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Restore Backup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 