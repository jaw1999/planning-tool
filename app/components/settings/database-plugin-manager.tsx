import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Download, Upload, Package, AlertCircle, Loader2, X, File } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from '@/app/components/ui/use-toast';
import axios from 'axios';

interface DatabasePluginManagerProps {
  onInstall: (plugin: File) => Promise<void>;
  onExport: () => Promise<void>;
}

export function DatabasePluginManager({ onInstall, onExport }: DatabasePluginManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<File | null>(null);

  const handlePluginSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.dbplugin')) {
      setSelectedPlugin(file);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid database plugin file (.dbplugin)',
        variant: 'error',
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedPlugin(null);
    // Reset the file input
    const fileInput = document.getElementById('plugin-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleInstall = async () => {
    if (!selectedPlugin) return;
    
    try {
      setLoading(true);
      await onInstall(selectedPlugin);
      setSelectedPlugin(null);
      // Reset the file input after successful installation
      const fileInput = document.getElementById('plugin-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      toast({
        title: 'Success',
        description: 'Database plugin installed successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Installation Failed',
        description: 'Failed to install database plugin',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Database Plugin Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Install Plugin</h4>
                <p className="text-sm text-muted-foreground">
                  Import a database from another installation
                </p>
              </div>
              <input
                type="file"
                accept=".dbplugin"
                onChange={handlePluginSelect}
                className="hidden"
                id="plugin-upload"
              />
              <div className="flex gap-2">
                {selectedPlugin && (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-700">{selectedPlugin.name}</span>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('plugin-upload')?.click()}
                >
                  Select File
                </Button>
                <Button
                  onClick={handleInstall}
                  disabled={!selectedPlugin || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Install
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Export as Plugin</h4>
                <p className="text-sm text-muted-foreground">
                  Create a portable database plugin
                </p>
              </div>
              <Button
                onClick={onExport}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Plugin
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 