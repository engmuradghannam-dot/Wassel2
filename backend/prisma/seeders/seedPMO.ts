import prisma from '../src/utils/prisma';

async function seedPMO() {
  console.log('Seeding PMO Master Workbook data...');

  // Find a company and user to associate with
  const company = await prisma.company.findFirst();
  const user = await prisma.user.findFirst();

  if (!company || !user) {
    console.log('⚠️ No company or user found. Skipping PMO seed.');
    return;
  }

  // Create a sample PMO project
  const project = await prisma.pMOProject.create({
    data: {
      projectCode: 'PMO-001',
      name: 'ERP Implementation',
      description: 'Enterprise Resource Planning system implementation',
      ownerId: user.id,
      companyId: company.id,
      status: 'ACTIVE',
      priority: 'HIGH',
      budget: 500000,
      progressPercent: 35,

      charter: {
        create: {
          purpose: 'Implement unified ERP system',
          objectives: 'Streamline operations, improve reporting',
          scope: 'All departments',
          constraints: 'Budget, timeline',
          deliverables: 'Deployed ERP, trained staff',
          successCriteria: 'Go-live within 6 months',
        },
      },

      stakeholders: {
        create: [
          { name: 'CEO', role: 'Executive Sponsor', influence: 'HIGH', interest: 'HIGH' },
          { name: 'CFO', role: 'Financial Approver', influence: 'HIGH', interest: 'MEDIUM' },
          { name: 'IT Director', role: 'Technical Lead', influence: 'MEDIUM', interest: 'HIGH' },
        ],
      },

      milestones: {
        create: [
          { name: 'Project Kickoff', targetDate: new Date('2026-01-15'), status: 'ACHIEVED' },
          { name: 'Requirements Complete', targetDate: new Date('2026-03-01'), status: 'ACHIEVED' },
          { name: 'System Design', targetDate: new Date('2026-05-01'), status: 'PENDING' },
          { name: 'Go Live', targetDate: new Date('2026-07-01'), status: 'PENDING' },
        ],
      },

      risks: {
        create: [
          { riskCode: 'R001', description: 'Budget overrun', category: 'FINANCIAL', probability: 3, impact: 4, score: 12, mitigation: 'Monthly budget reviews', status: 'OPEN' },
          { riskCode: 'R002', description: 'Resource unavailability', category: 'RESOURCE', probability: 2, impact: 3, score: 6, mitigation: 'Backup resource plan', status: 'OPEN' },
        ],
      },

      budgetItems: {
        create: [
          { category: 'LABOR', itemName: 'Consultants', plannedAmount: 200000 },
          { category: 'SOFTWARE', itemName: 'ERP Licenses', plannedAmount: 150000 },
          { category: 'HARDWARE', itemName: 'Servers', plannedAmount: 100000 },
          { category: 'TRAINING', itemName: 'Staff Training', plannedAmount: 50000 },
        ],
      },
    },
  });

  console.log(`✅ Created PMO project: ${project.name}`);
  console.log('PMO seeding complete!');
}

seedPMO()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
