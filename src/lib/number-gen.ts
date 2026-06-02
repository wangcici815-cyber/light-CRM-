import { prisma } from "./prisma";

export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `Q-${year}-`;

  const rows = await prisma.$queryRawUnsafe<Array<{ quoteNumber: string }>>(
    `SELECT quoteNumber FROM Quotation WHERE quoteNumber LIKE '${prefix}%' ORDER BY quoteNumber DESC LIMIT 1`
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].quoteNumber;
    const parts = lastNum.split("-");
    nextSeq = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C-${year}-`;

  const rows = await prisma.$queryRawUnsafe<Array<{ contractNumber: string }>>(
    `SELECT contractNumber FROM Contract WHERE contractNumber LIKE '${prefix}%' ORDER BY contractNumber DESC LIMIT 1`
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const lastNum = rows[0].contractNumber;
    const parts = lastNum.split("-");
    nextSeq = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}
