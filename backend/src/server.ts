import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import companyRoutes from './routes/companies';
import branchRoutes from './routes/branches';
import chatRoutes from './routes/chat';
import warehouseRoutes from './routes/warehouses';
import accountRoutes from './routes/accounts';
import journalEntryRoutes from './routes/journalEntries';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import itemRoutes from './routes/items';
import stockEntryRoutes from './routes/stockEntries';
import invoiceRoutes from './routes/invoices';
import salesOrderRoutes from './routes/salesOrders';
import purchaseOrderRoutes from './routes/purchaseOrders';
import purchaseReceiptRoutes from './routes/purchaseReceipts';
import paymentRoutes from './routes/payments';
import employeeRoutes from './routes/employees';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leaves';
import payrollRoutes from './routes/payrolls';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import crmRoutes from './routes/crm';
import assetRoutes from './routes/assets';
import manufacturingRoutes from './routes/manufacturing';
import manufacturingExtraRoutes from './routes/manufacturingExtra';
import quotationRoutes from './routes/quotations';
import rfqRoutes from './routes/rfqs';
import deliveryNoteRoutes from './routes/deliveryNotes';
import issueRoutes from './routes/issues';
import recruitmentRoutes from './routes/recruitment';
import performanceReviewRoutes from './routes/performanceReviews';
import projectExpenseClaimRoutes from './routes/projectExpenseClaims';
import maintenanceRoutes from './routes/maintenance';

import { setupSwagger } from './swagger';

import notificationRoutes from './routes/notifications';
import approvalRoutes from './routes/approvals';
import emailRoutes from './routes/emails';
import exportRoutes from './routes/exports';
import importRoutes from './routes/imports';
import fileRoutes from './routes/files';
import activityLogRoutes from './routes/activityLogs';
import settingsRoutes from './routes/settings';
import zakatRoutes from './routes/zakat';

import contactRoutes from './routes/contacts';
import bankDetailRoutes from './routes/bankDetails';
import partnerFunctionRoutes from './routes/partnerFunctions';
import mrpRoutes from './routes/mrp';
import batchRoutes from './routes/batches';
import serialNumberRoutes from './routes/serialNumbers';
import uomConversionRoutes from './routes/uomConversions';
import priceListRoutes from './routes/priceLists';
import costCenterRoutes from './routes/costCenters';
import consolidationRoutes from './routes/consolidation';
import salesForecastRoutes from './routes/salesForecasts';
import iotDeviceRoutes from './routes/iotDevices';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);
app.use(rateLimiter);

// Swagger API Documentation
setupSwagger(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/stock-entries', stockEntryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/purchase-receipts', purchaseReceiptRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payrolls', payrollRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/manufacturing', manufacturingExtraRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/delivery-notes', deliveryNoteRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/performance-reviews', performanceReviewRoutes);
app.use('/api/project-expense-claims', projectExpenseClaimRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/zakat', zakatRoutes);

app.use('/api/contacts', contactRoutes);
app.use('/api/bank-details', bankDetailRoutes);
app.use('/api/partner-functions', partnerFunctionRoutes);
app.use('/api/mrp', mrpRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/serial-numbers', serialNumberRoutes);
app.use('/api/uom-conversions', uomConversionRoutes);
app.use('/api/price-lists', priceListRoutes);
app.use('/api/cost-centers', costCenterRoutes);
app.use('/api/company-groups', consolidationRoutes);
app.use('/api/sales-forecasts', salesForecastRoutes);
app.use('/api/iot-devices', iotDeviceRoutes);

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           MuradERP Server v1.0.0                            ║
║           Proprietary - All Rights Reserved                  ║
║           © 2026 Murad Ghannam                               ║
║                                                              ║
║           Server running on port ${PORT}                          ║
║           Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

export { io, app, httpServer };
