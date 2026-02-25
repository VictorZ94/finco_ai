import { AccountType, Nature } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

async function main() {
  // Clear existing data (optional, but good for seeding)
  // For safety, we'll just check if a user exists first or create a default one
  const user = await prisma.user.upsert({
    where: { email: "zrvictor00@gmail.com" },
    update: {},
    create: {
      email: "zrvictor00@gmail.com",
      name: "Victor Zuluaga",
    },
  });

  const userId = user.id;

  const accounts = [
    // Clase 1: Activo
    {
      code: "1105-05",
      name: "Efectivo en Bolsillo",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1105",
      userId,
    },
    {
      code: "1110-10",
      name: "Cta de Ahorros Bancolombia",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1110",
      userId,
    },
    {
      code: "1110-15",
      name: "Cta de Ahorros Nubank",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1110",
      userId,
    },
    {
      code: "1225-05",
      name: "CDT Bancolombia",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1225",
      userId,
    },
    {
      code: "1225-10",
      name: "CDT Bancolombia",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1225",
      userId,
    },

    // Clase 2: Pasivo
    {
      code: "2105-01",
      name: "Prestamo Bancolombia",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      accountType: AccountType.LIABILITY,
      userId,
    },
    {
      code: "2105-02",
      name: "Tarjeta de Crédito Nubank",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      accountType: AccountType.LIABILITY,
      userId,
    },
    {
      code: "2105-03",
      name: "Tarjeta de Credito Bco de Occidente",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      accountType: AccountType.LIABILITY,
      userId,
    },
    {
      code: "2305-01",
      name: "Cuenta por Pagar",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2305",
      accountType: AccountType.LIABILITY,
      userId,
    },

    // Clase 3: Patrimonio
    {
      code: "3105-05",
      name: "Capital Autorizado",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "3105",
      accountType: AccountType.EQUITY,
      userId,
    },

    // Clase 4: Ingresos
    {
      code: "4135-05",
      name: "Ingresos",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.INCOME,
      parentCode: "4135",
      userId,
    },

    // Clase 5: Gastos
    {
      code: "5105-01",
      name: "Sueldos",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5105",
      userId,
    },
    {
      code: "5125-01",
      name: "Alimentación",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5125",
      userId,
    },
    {
      code: "5135-01",
      name: "Servicios Públicos",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5135",
      userId,
    },
    {
      code: "5135-02",
      name: "Plan de datos Celular",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5135",
      userId,
    },
    {
      code: "5135-03",
      name: "Gasolina",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "5135",
      accountType: AccountType.EXPENSE,
      userId,
    },
    {
      code: "5140-01",
      name: "Consulares",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5140",
      userId,
    },
    {
      code: "5155-01",
      name: "Alojamiento",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5155",
      userId,
    },
    {
      code: "5155-02",
      name: "Tiquetes Aéreos",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5155",
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
