import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';

const prisma = new PrismaClient();

export async function login(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = signToken({
    adminId: admin.id,
    email: admin.email,
  });

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
    },
  };
}

export async function verifyAdmin(adminId: string) {
  return prisma.admin.findUnique({
    where: { id: adminId },
  });
}

