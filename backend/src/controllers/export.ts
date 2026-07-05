import { Response, NextFunction } from 'express';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const exportToCSV = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { data, fields, filename } = req.body;
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.csv"`);
    res.send(csv);
  } catch (error) {
    next(new AppError('CSV export failed', 500));
  }
};

export const exportToPDF = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { title, content, headers, rows } = req.body;
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title || 'document'}.pdf"`);
      res.send(pdfData);
    });

    doc.fontSize(20).text(title || 'Document', 50, 50);
    doc.moveDown();

    if (headers && rows) {
      let x = 50;
      headers.forEach((h: string) => { doc.fontSize(10).text(h, x, doc.y, { width: 100 }); x += 100; });
      doc.moveDown();
      rows.forEach((row: string[]) => {
        let x = 50;
        row.forEach((cell: string) => { doc.fontSize(10).text(String(cell), x, doc.y, { width: 100 }); x += 100; });
        doc.moveDown();
      });
    } else {
      doc.fontSize(12).text(content || '', 50, doc.y);
    }
    doc.end();
  } catch (error) {
    next(new AppError('PDF export failed', 500));
  }
};

export const exportToExcel = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { data, filename } = req.body;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.xlsx"`);
    res.json(data);
  } catch (error) {
    next(new AppError('Excel export failed', 500));
  }
};

export const getExportFormats = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.json(successResponse([
      { id: 'csv', name: 'CSV', mimeType: 'text/csv' },
      { id: 'pdf', name: 'PDF', mimeType: 'application/pdf' },
      { id: 'excel', name: 'Excel', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { id: 'json', name: 'JSON', mimeType: 'application/json' },
    ]));
  } catch (error) {
    next(error);
  }
};
