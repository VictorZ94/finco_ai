import { Nature } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

async function main() {
  // Clear existing data (optional, but good for seeding)
  // For safety, we'll just check if a user exists first or create a default one
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
    },
  });

  const userId = user.id;

  const accounts = [
    // Clase 1: Activo
    {
      code: "1",
      name: "Activo",
      nature: Nature.DEBIT,
      level: 1,
      canReceiveMovement: false,
      userId,
    },
    {
      code: "11",
      name: "Moneda",
      nature: Nature.DEBIT,
      level: 2,
      canReceiveMovement: false,
      parentCode: "1",
      userId,
    },
    {
      code: "1105",
      name: "Efectivo o equivalente",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "11",
      userId,
    },
    {
      code: "110505",
      name: "Efectivo en Bolsillo",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "1105",
      userId,
    },
    {
      code: "110510",
      name: "Saldo en Banco",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "1105",
      userId,
    },

    {
      code: "1110",
      name: "Bancos",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "11",
      userId,
    },
    {
      code: "111005",
      name: "Bancos Nacionales",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "1110",
      userId,
    },

    // Clase 2: Pasivo
    {
      code: "2",
      name: "Pasivo",
      nature: Nature.CREDIT,
      level: 1,
      canReceiveMovement: false,
      userId,
    },
    {
      code: "21",
      name: "Obligaciones Financieras",
      nature: Nature.CREDIT,
      level: 2,
      canReceiveMovement: false,
      parentCode: "2",
      userId,
    },
    {
      code: "2105",
      name: "Bancos Nacionales",
      nature: Nature.CREDIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "21",
      userId,
    },
    {
      code: "210505",
      name: "Sobregiros",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      userId,
    },

    // Clase 3: Patrimonio
    {
      code: "3",
      name: "Patrimonio",
      nature: Nature.CREDIT,
      level: 1,
      canReceiveMovement: false,
      userId,
    },
    {
      code: "31",
      name: "Capital Social",
      nature: Nature.CREDIT,
      level: 2,
      canReceiveMovement: false,
      parentCode: "3",
      userId,
    },
    {
      code: "3105",
      name: "Capital Suscrito y Pagado",
      nature: Nature.CREDIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "31",
      userId,
    },
    {
      code: "310505",
      name: "Capital Autorizado",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "3105",
      userId,
    },

    // Clase 4: Ingresos
    {
      code: "4",
      name: "Ingresos",
      nature: Nature.CREDIT,
      level: 1,
      canReceiveMovement: false,
      userId,
    },
    {
      code: "41",
      name: "Operacionales",
      nature: Nature.CREDIT,
      level: 2,
      canReceiveMovement: false,
      parentCode: "4",
      userId,
    },
    {
      code: "4135",
      name: "Comercio al por mayor y al por menor",
      nature: Nature.CREDIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "41",
      userId,
    },
    {
      code: "413505",
      name: "Venta de productos",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "4135",
      userId,
    },

    // Clase 5: Gastos
    {
      code: "5",
      name: "Gastos",
      nature: Nature.DEBIT,
      level: 1,
      canReceiveMovement: false,
      userId,
    },
    {
      code: "51",
      name: "Operacionales de Administración",
      nature: Nature.DEBIT,
      level: 2,
      canReceiveMovement: false,
      parentCode: "5",
      userId,
    },
    {
      code: "5105",
      name: "Gastos de Personal",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "51",
      userId,
    },
    {
      code: "510506",
      name: "Sueldos",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "5105",
      userId,
    },
  ];

  for (const acc of accounts) {
    const { parentCode, ...accData } = acc as any;
    let parentId = null;

    if (parentCode) {
      const parent = await prisma.financialAccounts.findUnique({
        where: { userId_code: { userId, code: parentCode } },
      });
      parentId = parent?.id;
    }

    await prisma.financialAccounts.upsert({
      where: { userId_code: { userId, code: accData.code } },
      update: { ...accData, parentId },
      create: { ...accData, parentId },
    });
  }

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
