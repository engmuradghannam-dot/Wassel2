// ZATCA (Saudi e-invoicing) Phase 1 QR code generation
// Encodes the 5 required TLV (Tag-Length-Value) fields per the Fatoora spec:
// 1: Seller name, 2: VAT registration number, 3: Timestamp (ISO 8601),
// 4: Invoice total (with VAT), 5: VAT total
// Reference: ZATCA e-invoicing implementation standard, Phase 1 (Generation)

function tlvField(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf8');
  const header = Buffer.from([tag, valueBuffer.length]);
  return Buffer.concat([header, valueBuffer]);
}

export interface ZatcaInvoiceData {
  sellerName: string;
  vatNumber: string;
  timestamp: Date;
  invoiceTotal: number;
  vatTotal: number;
}

/**
 * Builds the base64-encoded TLV payload that ZATCA-compliant QR codes must contain.
 * This string is what gets encoded into the QR image itself.
 */
export function buildZatcaTlvBase64(data: ZatcaInvoiceData): string {
  const fields = [
    tlvField(1, data.sellerName),
    tlvField(2, data.vatNumber),
    tlvField(3, data.timestamp.toISOString()),
    tlvField(4, data.invoiceTotal.toFixed(2)),
    tlvField(5, data.vatTotal.toFixed(2)),
  ];
  return Buffer.concat(fields).toString('base64');
}
