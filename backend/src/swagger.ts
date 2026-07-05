import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wassel ERP API',
      description: 'Complete ERP API Documentation for Wassel - Open Source ERP System',
      version: '1.0.0',
      contact: {
        name: 'Murad Ghannam',
        email: 'eng.murad.ghannam@gmail.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://github.com/engmuradghannam-dot/Wassel2',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.wassel.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token from login/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234567890' },
            email: { type: 'string', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
            phone: { type: 'string', example: '+966501234567' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'My Company' },
            nameAr: { type: 'string', example: 'شركتي' },
            taxId: { type: 'string', example: '1234567890' },
            logo: { type: 'string' },
            address: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            defaultCurrency: { type: 'string', example: 'SAR' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'CUST-001' },
            name: { type: 'string', example: 'Customer Name' },
            nameAr: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            taxId: { type: 'string' },
            creditLimit: { type: 'number', example: 10000 },
            paymentTerms: { type: 'number', example: 30 },
            customerType: { type: 'string', enum: ['INDIVIDUAL', 'COMPANY'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        Supplier: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'SUP-001' },
            name: { type: 'string' },
            nameAr: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            taxId: { type: 'string' },
            paymentTerms: { type: 'number' },
            supplierType: { type: 'string', enum: ['INDIVIDUAL', 'COMPANY'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        Item: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            itemCode: { type: 'string', example: 'ITEM-001' },
            name: { type: 'string' },
            nameAr: { type: 'string' },
            description: { type: 'string' },
            unitPrice: { type: 'number' },
            costPrice: { type: 'number' },
            uom: { type: 'string', example: 'piece' },
            category: { type: 'string' },
            itemType: { type: 'string', enum: ['PRODUCT', 'SERVICE', 'RAW_MATERIAL'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            employeeId: { type: 'string', example: 'EMP-001' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            department: { type: 'string' },
            designation: { type: 'string' },
            joinDate: { type: 'string', format: 'date' },
            salary: { type: 'number' },
            employmentType: { type: 'string', enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'] },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            invoiceNumber: { type: 'string', example: 'INV-2024-001' },
            customerId: { type: 'string' },
            totalAmount: { type: 'number' },
            taxAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            netAmount: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'PAID', 'CANCELLED', 'OVERDUE'] },
            invoiceDate: { type: 'string', format: 'date' },
            dueDate: { type: 'string', format: 'date' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            poNumber: { type: 'string', example: 'PO-2024-001' },
            supplierId: { type: 'string' },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED'] },
            orderDate: { type: 'string', format: 'date' },
            expectedDeliveryDate: { type: 'string', format: 'date' },
          },
        },
        SalesOrder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            soNumber: { type: 'string', example: 'SO-2024-001' },
            customerId: { type: 'string' },
            totalAmount: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
            orderDate: { type: 'string', format: 'date' },
          },
        },
        Branch: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'BR-001' },
            name: { type: 'string' },
            nameAr: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string', example: 'SA' },
            phone: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'WH-001' },
            name: { type: 'string' },
            branchId: { type: 'string' },
            address: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            accountCode: { type: 'string', example: '1000' },
            name: { type: 'string' },
            nameAr: { type: 'string' },
            accountType: { type: 'string', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] },
            accountCategory: { type: 'string' },
            parentAccountId: { type: 'string' },
            isGroup: { type: 'boolean' },
            balance: { type: 'number' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', enum: ['SYSTEM', 'APPROVAL', 'REMINDER', 'ALERT'] },
            link: { type: 'string' },
            read: { type: 'boolean' },
            readAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            documentType: { type: 'string' },
            companyId: { type: 'string' },
            isActive: { type: 'boolean' },
            states: { type: 'array', items: { type: 'object' } },
            transitions: { type: 'array', items: { type: 'object' } },
          },
        },
        ZakatCalculation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            companyId: { type: 'string' },
            year: { type: 'integer' },
            hijriYear: { type: 'string' },
            cash: { type: 'number' },
            inventory: { type: 'number' },
            receivables: { type: 'number' },
            investments: { type: 'number' },
            goldSilver: { type: 'number' },
            debts: { type: 'number' },
            totalAssets: { type: 'number' },
            netAssets: { type: 'number' },
            zakatAmount: { type: 'number' },
            nisabThreshold: { type: 'number' },
            calculatedBy: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/swagger/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Wassel ERP API Documentation',
  }));

  // Serve raw JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export default swaggerSpec;
