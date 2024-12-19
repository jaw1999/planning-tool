import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Upload, Download, File, AlertCircle, Eye, Check, X } from 'lucide-react';
import axios from 'axios';

interface ImportPreview {
  systemName: string;
  fileType: string;
  extractedFields: string[];
  missingFields: string[];
  rawData: any;
}

interface DataManagementProps {
  onImport: (file: File) => Promise<void>;
  onExport: (format: 'csv' | 'json') => Promise<void>;
}

export function DataManagement({ onImport, onExport }: DataManagementProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    // Preview first file
    if (files.length > 0) {
      try {
        const formData = new FormData();
        formData.append('file', files[0]);
        
        const response = await axios.post('/api/import/preview', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setImportPreview(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to generate preview');
        setImportPreview(null);
      }
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setError(null);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        await axios.post('/api/import/process', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            setProgress(percentCompleted);
          },
        });
      }
      
      setSelectedFiles([]);
      setImportPreview(null);
    } catch (err) {
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const response = await axios.get(`/api/export/systems?format=${format}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `systems-export-${new Date().toISOString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    
    // Preview first file
    if (files.length > 0) {
      try {
        const formData = new FormData();
        formData.append('file', files[0]);
        
        const response = await axios.post('/api/import/preview', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setImportPreview(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to generate preview');
        setImportPreview(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Import Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors duration-200"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.csv,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <span className="mt-2 block text-sm font-medium">
                  Drop files here or click to upload
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PDF, CSV, or JSON files
                </span>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <button
                        onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Preview */}
            {importPreview && (
              <div className="mt-4 border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <p>System: {importPreview.systemName}</p>
                  <div>
                    <p className="text-green-600">Fields found:</p>
                    <ul className="list-disc list-inside">
                      {importPreview.extractedFields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                  {importPreview.missingFields.length > 0 && (
                    <div>
                      <p className="text-amber-600">Missing fields (will need manual input):</p>
                      <ul className="list-disc list-inside">
                        {importPreview.missingFields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {importing && (
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        Importing...
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{ width: `${progress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-600 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing || selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Files'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export Systems
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}