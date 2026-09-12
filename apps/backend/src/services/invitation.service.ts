import prisma from '../config/prisma';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { sendInvitationEmail } from './email.service';
import { SystemRole } from '@prisma/client';

export const createInvitation = async ({
  email,
  role,
  organizationId,
  createdById
}: {
  email: string;
  role: SystemRole;
  organizationId: string;
  createdById: string;
}) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(`User with email ${email} already exists.`);
    }

    // Cancel any existing pending invitations for this email
    await prisma.invitation.updateMany({
      where: { email, status: 'PENDING' },
      data: { status: 'CANCELLED' }
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        organizationId,
        token,
        expiresAt,
        createdById,
        status: 'PENDING'
      }
    });

    // Send Email
    await sendInvitationEmail(email, role, token);

    return invitation;
  } catch (error) {
    logger.error(`[createInvitation] Failed: ${error}`);
    throw error;
  }
};

export const validateInvitationToken = async (token: string) => {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new Error('Invalid invitation token.');
  
  if (invitation.status !== 'PENDING') {
    throw new Error(`Invitation is already ${invitation.status.toLowerCase()}.`);
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    });
    throw new Error('Invitation has expired.');
  }

  return invitation;
};
