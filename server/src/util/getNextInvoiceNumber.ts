
let invoiceCounter = 1001;

export const nextInvoiceNumber = (date: Date): string =>
  `INV-${date.getFullYear()}-${invoiceCounter++}`;
