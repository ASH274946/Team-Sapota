import { logger } from '../utils/logger';

// A stubbed email service to simulate sending emails
export const sendEmail = async ({ to, subject, body }: { to: string; subject: string; body: string }): Promise<void> => {
  logger.info(`[EmailService] Mock sending email to: ${to}`);
  logger.info(`[EmailService] Subject: ${subject}`);
  logger.info(`[EmailService] Body: ${body}`);
  // In a real application, connect to SendGrid, SES, Nodemailer, etc.
};

export const sendInvitationEmail = async (email: string, role: string, token: string): Promise<void> => {
  const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: `You have been invited to join VidyaAI as a ${role}`,
    body: `Hello,\n\nYou have been invited to join VidyaAI. Please click the link below to accept your invitation and set up your password.\n\n${acceptLink}\n\nThis link expires in 7 days.`
  });
};
