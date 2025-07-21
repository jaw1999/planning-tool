'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Shield, Key, Copy, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";

interface MFAStatus {
  mfaEnabled: boolean;
  hasSecret: boolean;
  backupCodesCount: number;
}

interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpauthUrl: string;
}

export function MFASettings() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/setup');
      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch MFA status",
          variant: "error"
        });
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch MFA status",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setShowSetupDialog(true);
      } else {
        const error = await response.json();
        toast({
          title: "Setup Failed",
          description: error.error || "Failed to setup MFA",
          variant: "error"
        });
      }
    } catch (error) {
      console.error('Error setting up MFA:', error);
      toast({
        title: "Error",
        description: "Failed to setup MFA",
        variant: "error"
      });
    } finally {
      setProcessing(false);
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast({
        title: "Invalid Token",
        description: "Please enter a 6-digit verification code",
        variant: "error"
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          enable: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "MFA Enabled",
            description: "Two-factor authentication has been successfully enabled",
            variant: "success"
          });
          setShowSetupDialog(false);
          setVerificationToken('');
          setSetupData(null);
          fetchMFAStatus();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Verification Failed",
          description: error.error || "Invalid verification code",
          variant: "error"
        });
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast({
        title: "Error",
        description: "Failed to verify MFA token",
        variant: "error"
      });
    } finally {
      setProcessing(false);
    }
  };

  const disableMFA = async () => {
    if (!disableToken || !disablePassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both your password and MFA token",
        variant: "error"
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: disableToken,
          password: disablePassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "MFA Disabled",
            description: "Two-factor authentication has been disabled",
            variant: "success"
          });
          setShowDisableDialog(false);
          setDisableToken('');
          setDisablePassword('');
          fetchMFAStatus();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Disable Failed",
          description: error.error || "Failed to disable MFA",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast({
        title: "Error",
        description: "Failed to disable MFA",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
      variant: "default"
    });
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const content = `Military Planning Tool - MFA Backup Codes
Generated: ${new Date().toISOString()}

BACKUP CODES:
${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

IMPORTANT:
- Keep these codes in a safe place
- Each code can only be used once
- These codes can be used if you lose access to your authenticator app
- Do not share these codes with anyone`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Backup codes saved to file",
      variant: "default"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge 
                variant={mfaStatus?.mfaEnabled ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {mfaStatus?.mfaEnabled ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>
            {mfaStatus?.mfaEnabled && (
              <p className="text-sm text-muted-foreground">
                Backup codes: {mfaStatus.backupCodesCount} remaining
              </p>
            )}
          </div>
          
          {!mfaStatus?.mfaEnabled ? (
            <Button 
              onClick={setupMFA} 
              disabled={processing}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Enable MFA
            </Button>
          ) : (
            <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Disable MFA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will disable MFA protection on your account. You'll need to verify your identity.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="disable-password">Current Password</Label>
                    <Input
                      id="disable-password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="disable-token">MFA Token</Label>
                    <Input
                      id="disable-token"
                      value={disableToken}
                      onChange={(e) => setDisableToken(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDisableDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={disableMFA}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? 'Processing...' : 'Disable MFA'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Setup Dialog */}
        <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            </DialogHeader>
            
            {setupData && (
              <Tabs defaultValue="qr-code" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="qr-code">QR Code</TabsTrigger>
                  <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                  <TabsTrigger value="backup-codes">Backup Codes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="qr-code" className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    <div className="flex justify-center">
                      <img 
                        src={setupData.qrCode} 
                        alt="MFA QR Code" 
                        className="border rounded-lg"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      If you can't scan the QR code, enter this secret manually in your authenticator app:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={setupData.secret} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(setupData.secret, 'Secret key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="backup-codes" className="space-y-4">
                  <div className="space-y-4">
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertDescription>
                        Save these backup codes in a safe place. Each code can only be used once.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                      {setupData.backupCodes.map((code, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{index + 1}.</span>
                          <span>{code}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={downloadBackupCodes}
                      className="w-full flex items-center gap-2"
                      variant="outline"
                    >
                      <Download className="h-4 w-4" />
                      Download Backup Codes
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="verification-token">Enter verification code from your app</Label>
                <Input
                  id="verification-token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSetupDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={verifyAndEnableMFA}
                  disabled={processing || verificationToken.length !== 6}
                  className="flex-1"
                >
                  {processing ? 'Verifying...' : 'Enable MFA'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Information */}
        <div className="space-y-2">
          <h3 className="font-medium">About Two-Factor Authentication</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Adds an extra layer of security to your account</li>
            <li>• Requires both your password and a code from your mobile device</li>
            <li>• Compatible with Google Authenticator, Authy, and other TOTP apps</li>
            <li>• Backup codes allow access if you lose your device</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 