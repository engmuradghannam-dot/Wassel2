import prisma from '../src/utils/prisma';

const industries = [
  { industryId: 'AVI', name: 'Aviation & Airlines', category: 'Transportation', description: 'Airlines, aircraft operations, aviation services' },
  { industryId: 'AIRPORT', name: 'Airport Management', category: 'Transportation', description: 'Airport operations and facilities' },
  { industryId: 'HLT', name: 'Hospital & Healthcare', category: 'Healthcare', description: 'Hospitals and medical systems' },
  { industryId: 'CLN', name: 'Clinics & Medical Centers', category: 'Healthcare', description: 'Outpatient healthcare' },
  { industryId: 'PHA', name: 'Pharmaceutical', category: 'Healthcare', description: 'Drug manufacturing and distribution' },
  { industryId: 'MFG', name: 'Manufacturing', category: 'Industrial', description: 'General manufacturing' },
  { industryId: 'AUTO', name: 'Automotive Manufacturing', category: 'Industrial', description: 'Vehicle production' },
  { industryId: 'FNB', name: 'Food & Beverage', category: 'Manufacturing', description: 'Food production' },
  { industryId: 'CON', name: 'Construction', category: 'Engineering', description: 'Construction projects' },
  { industryId: 'ENG', name: 'Engineering Services', category: 'Engineering', description: 'Engineering companies' },
  { industryId: 'OIL', name: 'Oil & Gas', category: 'Energy', description: 'Oil and gas operations' },
  { industryId: 'ENE', name: 'Energy & Utilities', category: 'Energy', description: 'Power and utilities' },
  { industryId: 'REN', name: 'Renewable Energy', category: 'Energy', description: 'Solar and wind energy' },
  { industryId: 'MIN', name: 'Mining', category: 'Industrial', description: 'Mining operations' },
  { industryId: 'BANK', name: 'Banking', category: 'Finance', description: 'Banking operations' },
  { industryId: 'INS', name: 'Insurance', category: 'Finance', description: 'Insurance services' },
  { industryId: 'RET', name: 'Retail', category: 'Commerce', description: 'Retail operations' },
  { industryId: 'ECOM', name: 'E-Commerce', category: 'Commerce', description: 'Online commerce' },
  { industryId: 'LOG', name: 'Logistics', category: 'Transportation', description: 'Logistics and supply chain' },
  { industryId: 'GOV', name: 'Government', category: 'Public Sector', description: 'Government operations' },
];

const controls = [
  { industryId: 'AVI', module: 'Flight Operations', controlId: 'AVI-FOP-001', controlName: 'Flight Planning', subControl: 'Route Planning', description: 'Plan and optimize flights', required: true, aiAgentName: 'Flight AI Agent', databaseEntity: 'Flight', kpi: 'On Time Performance', compliance: 'IATA' },
  { industryId: 'AVI', module: 'Maintenance', controlId: 'AVI-MNT-001', controlName: 'Work Orders', subControl: 'Maintenance Tasks', description: 'Aircraft maintenance management', required: true, aiAgentName: 'Maintenance AI Agent', databaseEntity: 'Maintenance Order', kpi: 'Downtime', compliance: 'FAA' },
  { industryId: 'HLT', module: 'Patient Management', controlId: 'HLT-PAT-001', controlName: 'Patient Registration', subControl: 'Patient Profile', description: 'Manage patient records', required: true, aiAgentName: 'Patient AI Agent', databaseEntity: 'Patient', kpi: 'Patient Satisfaction', compliance: 'HIPAA' },
  { industryId: 'HLT', module: 'Clinical', controlId: 'HLT-CLN-001', controlName: 'Medical Records', subControl: 'Diagnosis', description: 'Clinical documentation', required: true, aiAgentName: 'Clinical AI Agent', databaseEntity: 'Medical Record', kpi: 'Treatment Quality', compliance: 'Healthcare' },
  { industryId: 'MFG', module: 'Production', controlId: 'MFG-PRO-001', controlName: 'Production Planning', subControl: 'MRP', description: 'Production planning and material requirements', required: true, aiAgentName: 'Production AI Agent', databaseEntity: 'Production Order', kpi: 'OEE', compliance: 'ISO9001' },
  { industryId: 'MFG', module: 'Quality', controlId: 'MFG-QA-001', controlName: 'Quality Inspection', subControl: 'Defect Tracking', description: 'Quality control process', required: true, aiAgentName: 'Quality AI Agent', databaseEntity: 'Inspection', kpi: 'Defect Rate', compliance: 'ISO9001' },
];

const aiAgents = [
  { industryId: 'AVI', name: 'Flight AI Agent', responsibility: 'Flight planning and operations', databaseEntity: 'Flight' },
  { industryId: 'HLT', name: 'Clinical AI Agent', responsibility: 'Clinical assistance', databaseEntity: 'Medical Record' },
  { industryId: 'MFG', name: 'Production AI Agent', responsibility: 'Production optimization', databaseEntity: 'Production Order' },
];

const entities = [
  { name: 'Customer', type: 'Master Data', usage: 'All Industries' },
  { name: 'Employee', type: 'Master Data', usage: 'All Industries' },
  { name: 'Asset', type: 'Asset Management', usage: 'Industrial Industries' },
  { name: 'Inventory', type: 'Supply Chain', usage: 'All Industries' },
  { name: 'Document', type: 'Compliance', usage: 'All Industries' },
  { name: 'Workflow', type: 'Process Engine', usage: 'All Industries' },
];

async function seedIndustryCatalog() {
  console.log('Seeding Industry Catalog...');

  // Clear existing data
  await prisma.aIAgent.deleteMany();
  await prisma.industryControl.deleteMany();
  await prisma.industryCatalog.deleteMany();
  await prisma.entityMaster.deleteMany();

  // Seed industries
  for (const industry of industries) {
    await prisma.industryCatalog.create({ data: industry });
  }
  console.log(`✅ Seeded ${industries.length} industries`);

  // Seed controls
  for (const control of controls) {
    await prisma.industryControl.create({ data: control });
  }
  console.log(`✅ Seeded ${controls.length} controls`);

  // Seed AI agents
  for (const agent of aiAgents) {
    await prisma.aIAgent.create({ data: agent });
  }
  console.log(`✅ Seeded ${aiAgents.length} AI agents`);

  // Seed entity masters
  for (const entity of entities) {
    await prisma.entityMaster.create({ data: entity });
  }
  console.log(`✅ Seeded ${entities.length} entity masters`);

  console.log('Industry Catalog seeding complete!');
}

seedIndustryCatalog()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
