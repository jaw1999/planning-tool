'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from '@/app/components/ui/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('You must acknowledge that you suck at planning to continue');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', credentials);
      if (response.data.success) {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    try {
      toast({
        title: 'Redirecting',
        description: 'Taking you to password reset...',
        variant: 'info'
      });
      console.log('Toast called');
      router.push('/forgot-password');
      console.log('Router push called');
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to navigate to password reset',
        variant: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-foreground">Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access the planning tool
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button
              type="button"
              variant="link"
              className="px-0 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                console.log('Button clicked');
                handleForgotPassword();
              }}
            >
              Forgot password?
            </Button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="bg-background border-input"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="bg-background border-input"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked: boolean) => setAgreedToTerms(checked)}
                />
                <label 
                  htmlFor="terms" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  By checking this box, I agree I suck at planning
                </label>
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <Button 
                className="w-full" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 