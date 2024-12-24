'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from '@/app/components/ui/use-toast';
import { useState, useEffect } from 'react';

export default function EmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const emailType = searchParams.get('type');
  const userId = searchParams.get('userId');

  const [emailData, setEmailData] = useState({
    to: searchParams.get('to') || '',
    subject: searchParams.get('subject') || '',
    message: '',
  });

  useEffect(() => {
    const createResetToken = async () => {
      if (emailType === 'reset' && userId) {
        try {
          const response = await fetch('/api/auth/create-reset-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (!response.ok) throw new Error('Failed to create reset token');
          
          const { token } = await response.json();
          const resetLink = `${window.location.origin}/reset-password?token=${token}&userId=${userId}`;
          const message = `
Hello,

A password reset has been requested for your account. Click the link below to reset your password:

${resetLink}

If you did not request this password reset, please ignore this email.

This link will expire in 1 hour.

Best regards,
Planning Tool Team
          `.trim();

          setEmailData(prev => ({
            ...prev,
            message,
          }));
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to create reset token',
            variant: 'error',
          });
          router.back();
        }
      }
    };

    createResetToken();
  }, [emailType, userId, router]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSending(true);
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          type: emailType,
          userId: userId
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      toast({
        title: 'Success',
        description: 'Email sent successfully',
        variant: 'success',
      });
      
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-6 space-y-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {emailType === 'reset' ? 'Send Password Reset Email' : 'Send Email'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To:</label>
              <Input
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject:</label>
              <Input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                readOnly={emailType === 'reset'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message:</label>
              <Textarea
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
                readOnly={emailType === 'reset'}
              />
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 