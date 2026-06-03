import { prisma } from "./prisma";

export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `Q-${year}-`;

  return prisma.$transaction(async (tx) => {
    const last = await tx.quotation.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: "desc" },
      select: { quoteNumber: true },
    });

    let nextSeq = 1;
    if (last) {
      const parts = last.quoteNumber.split("-");
      nextSeq = parseInt(parts[parts.length - 1]) + 1;
    }

    return `${prefix}${String(nextSeq).padStart(4, "0")}`;
  });
}

export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C-${year}-`;

  return prisma.$transaction(async (tx) => {
    const last = await tx.contract.findFirst({
      where: { contractNumber: { startsWith: prefix } },
      orderBy: { contractNumber: "desc" },
      select: { contractNumber: true },
    });

    let nextSeq = 1;
    if (last) {
      const parts = last.contractNumber.split("-");
      nextSeq = parseInt(parts[parts.length - 1]) + 1;
    }

    return `${prefix}${String(nextSeq).padStart(4, "0")}`;
  });
}
