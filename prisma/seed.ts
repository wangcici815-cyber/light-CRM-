import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = databaseUrl.replace("file:", "");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 创建默认管理员
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@crm.local" },
    update: {},
    create: {
      name: "管理员",
      email: "admin@crm.local",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // 创建默认销售阶段
  const stages = [
    { name: "初步接触", order: 0, color: "#6366f1", probability: 10 },
    { name: "需求分析", order: 1, color: "#3b82f6", probability: 25 },
    { name: "方案报价", order: 2, color: "#f59e0b", probability: 50 },
    { name: "商务谈判", order: 3, color: "#f97316", probability: 75 },
    { name: "成交", order: 4, color: "#22c55e", probability: 100 },
  ];

  const existingStages = await prisma.dealStage.count();
  if (existingStages === 0) {
    await prisma.dealStage.createMany({ data: stages });
  }

  // 创建默认标签
  const tags = [
    { name: "高意向", color: "#22c55e" },
    { name: "意向一般", color: "#f59e0b" },
    { name: "已流失", color: "#ef4444" },
    { name: "VIP客户", color: "#8b5cf6" },
    { name: "新客户", color: "#3b82f6" },
  ];

  const existingTags = await prisma.tag.count();
  if (existingTags === 0) {
    await prisma.tag.createMany({ data: tags });
  }

  // 创建测试客户
  const existingCustomers = await prisma.customer.count();
  if (existingCustomers === 0) {
    const customer1 = await prisma.customer.create({
      data: {
        name: "ABC科技有限公司",
        industry: "信息技术",
        source: "manual",
        phone: "13800138001",
        email: "contact@abc-tech.com",
        address: "北京市海淀区中关村大街1号",
        ownerId: admin.id,
      },
    });

    const customer2 = await prisma.customer.create({
      data: {
        name: "XYZ贸易有限公司",
        industry: "国际贸易",
        source: "manual",
        phone: "13800138002",
        email: "info@xyz-trade.com",
        address: "上海市浦东新区陆家嘴金融区",
        ownerId: admin.id,
      },
    });

    await prisma.contact.createMany({
      data: [
        { name: "张三", position: "技术总监", phone: "13900001111", email: "zhangsan@abc-tech.com", isPrimary: true, customerId: customer1.id },
        { name: "李四", position: "采购经理", phone: "13900002222", email: "lisi@abc-tech.com", customerId: customer1.id },
        { name: "王五", position: "总经理", phone: "13900003333", email: "wangwu@xyz-trade.com", isPrimary: true, customerId: customer2.id },
      ],
    });
  }

  // 创建测试商机、报价单和合同
  const existingDeals = await prisma.deal.count();
  if (existingDeals === 0) {
    const customers = await prisma.customer.findMany();
    const stages = await prisma.dealStage.findMany();
    if (customers.length > 0 && stages.length > 0) {
      const stage2 = stages.find(s => s.order === 2); // 方案报价
      const stage4 = stages.find(s => s.order === 4); // 成交

      if (stage2) {
        const deal1 = await prisma.deal.create({
          data: {
            title: "ERP系统实施项目",
            amount: 500000,
            stageId: stage2.id,
            customerId: customers[0].id,
            ownerId: admin.id,
            status: "OPEN",
          },
        });

        // 报价单
        await prisma.quotation.create({
          data: {
            quoteNumber: "Q-2026-0001",
            dealId: deal1.id,
            status: "SENT",
            totalAmount: 500000,
            items: {
              create: [
                { itemName: "ERP基础模块", description: "财务管理、采购管理、库存管理", quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 0 },
                { itemName: "HR模块", description: "人事管理、考勤管理", quantity: 1, unitPrice: 100000, amount: 100000, sortOrder: 1 },
                { itemName: "实施服务费", description: "系统部署、培训、数据迁移", quantity: 1, unitPrice: 100000, amount: 100000, sortOrder: 2 },
              ],
            },
          },
        });
      }

      if (stage4 && customers.length > 1) {
        const deal2 = await prisma.deal.create({
          data: {
            title: "进出口贸易管理系统",
            amount: 280000,
            stageId: stage4.id,
            customerId: customers[1].id,
            ownerId: admin.id,
            status: "WON",
          },
        });

        // 报价单
        await prisma.quotation.create({
          data: {
            quoteNumber: "Q-2026-0002",
            dealId: deal2.id,
            status: "ACCEPTED",
            totalAmount: 280000,
            items: {
              create: [
                { itemName: "贸易管理平台", description: "订单管理、报关管理、物流跟踪", quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 0 },
                { itemName: "增值服务", description: "定制开发、API对接", quantity: 1, unitPrice: 80000, amount: 80000, sortOrder: 1 },
              ],
            },
          },
        });

        // 合同
        await prisma.contract.create({
          data: {
            contractNumber: "C-2026-0001",
            dealId: deal2.id,
            title: "进出口贸易管理系统开发合同",
            totalAmount: 280000,
            status: "ACTIVE",
            startDate: new Date("2026-05-01"),
            endDate: new Date("2026-10-31"),
            content: "本合同约定XYZ贸易有限公司委托开发进出口贸易管理系统，包含订单管理、报关管理、物流跟踪等模块。",
            signedDate: new Date("2026-04-28"),
          },
        });
      }
    }
  }

  console.log("Seed data created successfully!");
  console.log(`  Admin: admin@crm.local / admin123`);
  console.log(`  Stages: ${await prisma.dealStage.count()}`);
  console.log(`  Tags: ${await prisma.tag.count()}`);
  console.log(`  Customers: ${await prisma.customer.count()}`);
  console.log(`  Deals: ${await prisma.deal.count()}`);
  console.log(`  Quotations: ${await prisma.quotation.count()}`);
  console.log(`  Contracts: ${await prisma.contract.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
