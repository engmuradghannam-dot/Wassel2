import { Response, NextFunction } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  body: z.string().min(1),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
  })).optional(),
});

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

export const sendEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = sendEmailSchema.parse(req.body);
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      text: data.body,
      html: data.html || data.body,
      attachments: data.attachments?.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
      })),
    });

    res.json(successResponse({ messageId: info.messageId }, 'Email sent successfully'));
  } catch (error) {
    next(new AppError('Failed to send email', 500));
  }
};

export const sendBulkEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { recipients, subject, body, html } = req.body;
    const transporter = createTransporter();

    const results = await Promise.allSettled(
      recipients.map((email: string) =>
        transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject,
          text: body,
          html: html || body,
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json(successResponse({ sent, failed, total: recipients.length }, 'Bulk email completed'));
  } catch (error) {
    next(new AppError('Failed to send bulk email', 500));
  }
};

export const getEmailTemplates = async (req: any, res: Response, next: NextFunction) => {
  try {
    const templates = [
      { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Wassel' },
      { id: 'invoice', name: 'Invoice Notification', subject: 'New Invoice' },
      { id: 'po', name: 'Purchase Order', subject: 'Purchase Order Approved' },
      { id: 'leave', name: 'Leave Approval', subject: 'Leave Request Update' },
      { id: 'password_reset', name: 'Password Reset', subject: 'Reset Your Password' },
    ];
    res.json(successResponse(templates));
  } catch (error) {
    next(error);
  }
};

export const testConnection = async (req: any, res: Response, next: NextFunction) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json(successResponse(null, 'SMTP connection verified'));
  } catch (error) {
    next(new AppError('SMTP connection failed', 500));
  }
};
