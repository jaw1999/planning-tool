import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { to, subject, message, type, userId } = await request.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    if (type === 'reset' && userId) {
      // Store the reset token in the database
      const resetToken = message.match(/token=([^&]+)/)?.[1];
      if (resetToken) {
        await prisma.passwordReset.create({
          data: {
            token: resetToken,
            userId: userId,
            expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          },
        });
      }
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 