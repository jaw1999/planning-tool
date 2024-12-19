import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/app/services/database/prisma';
import { Role, UserStatus } from '@prisma/client';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from the response
      }
    });
    
    if (!users) {
      console.error('No users found');
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, status } = body;
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    console.log('Creating user with email:', normalizedEmail);

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists with case-insensitive email
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (existingUser) {
      console.log('User already exists:', normalizedEmail);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: role as Role,
        status: status as UserStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('User created successfully:', user.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 