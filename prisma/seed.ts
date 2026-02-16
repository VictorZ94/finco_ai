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
    {
      code: "1",
      name: "Activo",
      nature: Nature.DEBIT,
      level: 1,
      canReceiveMovement: false,
      accountType: AccountType.ASSET,
      userId,
    },
    {
      code: "11",
      name: "Disponible",
      nature: Nature.DEBIT,
      level: 2,
      canReceiveMovement: false,
      accountType: AccountType.ASSET,
      parentCode: "1",
      userId,
    },
    {
      code: "1105",
      name: "Efectivo o equivalente",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.ASSET,
      parentCode: "11",
      userId,
    },
    {
      code: "110505",
      name: "Efectivo en Bolsillo",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1105",
      userId,
    },
    {
      code: "110510",
      name: "Cta de Ahorros Bancolombia",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1105",
      userId,
    },
    {
      code: "110515",
      name: "Cta de Ahorros Nubank",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1105",
      userId,
    },
    {
      code: "110520",
      name: "CDT Bancolombia",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.ASSET,
      parentCode: "1105",
      userId,
    },

    // Clase 2: Pasivo
    {
      code: "2",
      name: "Pasivo",
      nature: Nature.CREDIT,
      level: 1,
      canReceiveMovement: false,
      accountType: AccountType.LIABILITY,
      userId,
    },
    {
      code: "21",
      name: "Obligaciones Financieras",
      nature: Nature.CREDIT,
      level: 2,
      canReceiveMovement: false,
      accountType: AccountType.LIABILITY,
      parentCode: "2",
      userId,
    },
    {
      code: "2105",
      name: "Bancos Nacionales",
      nature: Nature.CREDIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.LIABILITY,
      parentCode: "21",
      userId,
    },
    {
      code: "210505",
      name: "Prestamo Bancolombia",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      accountType: AccountType.LIABILITY,
      userId,
    },
    {
      code: "210510",
      name: "Tarjeta de Crédito Nubank",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      accountType: AccountType.LIABILITY,
      userId,
    },
    {
      code: "210515",
      name: "Tarjeta de Credito Bco de Occidente",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "2105",
      accountType: AccountType.LIABILITY,
      userId,
    },

    // Clase 3: Patrimonio
    {
      code: "3",
      name: "Patrimonio",
      nature: Nature.CREDIT,
      level: 1,
      canReceiveMovement: false,
      accountType: AccountType.EQUITY,
      userId,
    },
    {
      code: "31",
      name: "Capital Social",
      nature: Nature.CREDIT,
      level: 2,
      canReceiveMovement: false,
      accountType: AccountType.EQUITY,
      parentCode: "3",
      userId,
    },
    {
      code: "3105",
      name: "Capital Suscrito y Pagado",
      nature: Nature.CREDIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.EQUITY,
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
      accountType: AccountType.EQUITY,
      userId,
    },

    // Clase 4: Ingresos
    {
      code: "4",
      name: "Ingresos",
      nature: Nature.CREDIT,
      level: 1,
      canReceiveMovement: false,
      accountType: AccountType.INCOME,
      userId,
    },
    {
      code: "41",
      name: "Operacionales",
      nature: Nature.CREDIT,
      level: 2,
      canReceiveMovement: false,
      accountType: AccountType.INCOME,
      parentCode: "4",
      userId,
    },
    {
      code: "4135",
      name: "Comercio al por mayor y al por menor",
      nature: Nature.CREDIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.INCOME,
      parentCode: "41",
      userId,
    },
    {
      code: "413505",
      name: "Servicios IT",
      nature: Nature.CREDIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.INCOME,
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
      accountType: AccountType.EXPENSE,
      userId,
    },
    {
      code: "51",
      name: "Operacionales de Administración",
      nature: Nature.DEBIT,
      level: 2,
      canReceiveMovement: false,
      accountType: AccountType.EXPENSE,
      parentCode: "5",
      userId,
    },
    {
      code: "5105",
      name: "Gastos de Personal",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.EXPENSE,
      parentCode: "51",
      userId,
    },
    {
      code: "510506",
      name: "Sueldos",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5105",
      userId,
    },
    {
      code: "5125",
      name: "Restaurantes y Cafeterías",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.EXPENSE,
      parentCode: "51",
      userId,
    },
    {
      code: "512505",
      name: "Alimentación",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5125",
      userId,
    },
    {
      code: "5135",
      name: "Servicios",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      accountType: AccountType.EXPENSE,
      parentCode: "51",
      userId,
    },
    {
      code: "513525",
      name: "Servicios Públicos",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5135",
      userId,
    },
    {
      code: "513535",
      name: "Plan de datos Celular",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5135",
      userId,
    },
    {
      code: "513555",
      name: "Gasolina",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      parentCode: "5135",
      accountType: AccountType.EXPENSE,
      userId,
    },
    {
      code: "5140",
      name: "Gastos Visa",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "51",
      accountType: AccountType.EXPENSE,
      userId,
    },
    {
      code: "514025",
      name: "Consulares",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5140",
      userId,
    },
    {
      code: "5155",
      name: "Gastos de Viaje",
      nature: Nature.DEBIT,
      level: 3,
      canReceiveMovement: false,
      parentCode: "51",
      accountType: AccountType.EXPENSE,
      userId,
    },
    {
      code: "515505",
      name: "Alojamiento",
      nature: Nature.DEBIT,
      level: 4,
      canReceiveMovement: true,
      accountType: AccountType.EXPENSE,
      parentCode: "5155",
      userId,
    },
    {
      code: "515515",
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
