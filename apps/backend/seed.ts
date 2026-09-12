/**
 * Seed script — populates the database with:
 * - Demo Institution + User
 * - 6 class groups with realistic student rosters
 * - 9 syllabuses (Classes 9-12 across subjects) with topics & subtopics
 *
 * Run: npx ts-node seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Set it to your Supabase connection string.');
}
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const INST_ID = 'demo-inst-id';
const USER_ID = 'demo-faculty-id';

async function main() {
  console.log('🌱 Seeding database...');

  // ── Institution ──────────────────────────────────────────────────────────
  const institution = await prisma.institution.upsert({
    where: { id: INST_ID },
    create: { id: INST_ID, name: 'VidyaAI Demo School', domain: 'vidyaai.demo' },
    update: { name: 'VidyaAI Demo School' },
  });
  console.log('✅ Institution:', institution.name);

  // ── Demo User ─────────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { id: USER_ID },
    create: {
      id: USER_ID,
      email: 'demo@bloomverify.com',
      passwordHash: 'demo-hash-not-real',
      firstName: 'Demo',
      lastName: 'Faculty',
      role: 'FACULTY',
      institutionId: INST_ID,
      preferences: {
        emailNotifications: true,
        darkMode: false,
        autoSave: true,
        weeklyDigest: false,
      },
    },
    update: {},
  });
  console.log('✅ User:', user.firstName, user.lastName);

  // ── Class Groups ──────────────────────────────────────────────────────────
  const groupDefs = [
    { name: 'Class 10-A', subject: 'Mathematics' },
    { name: 'Class 10-B', subject: 'Science' },
    { name: 'Class 11-A', subject: 'Physics' },
    { name: 'Class 11-B', subject: 'Chemistry' },
    { name: 'Class 12-A', subject: 'Computer Science' },
    { name: 'Class 12-B', subject: 'Biology' },
  ];

  const firstNames = ['Arjun', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Divya', 'Karan', 'Pooja', 'Ravi', 'Anjali', 'Amit', 'Kavya', 'Nikhil', 'Shreya', 'Rahul', 'Meera', 'Siddharth', 'Nisha', 'Aditya', 'Sunita'];
  const lastNames = ['Sharma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Reddy', 'Verma', 'Iyer', 'Nair', 'Bose', 'Rao', 'Saxena', 'Mishra', 'Pillai', 'Sinha', 'Kapoor', 'Malhotra', 'Ahuja'];

  for (const gDef of groupDefs) {
    const existing = await prisma.classGroup.findFirst({ where: { name: gDef.name, userId: USER_ID } });
    if (existing) {
      console.log(`⏭️  Group "${gDef.name}" already exists, skipping`);
      continue;
    }

    const group = await prisma.classGroup.create({
      data: { name: gDef.name, subject: gDef.subject, userId: USER_ID },
    });

    // Add 15-20 students
    const count = 15 + Math.floor(Math.random() * 6);
    const students = Array.from({ length: count }, (_, idx) => {
      const first = firstNames[(idx * 7) % firstNames.length];
      const last = lastNames[(idx * 13) % lastNames.length];
      return {
        groupId: group.id,
        name: `${first} ${last}`,
        rollNo: `R-${String(100 + idx + 1)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${idx}@school.edu`,
      };
    });
    await prisma.student.createMany({ data: students });
    console.log(`✅ Group: ${group.name} (${count} students)`);
  }

  // ── Syllabuses ────────────────────────────────────────────────────────────
  const syllabusDefs = [
    {
      title: 'Class 10 Mathematics',
      subject: 'Mathematics',
      grade: 'Class 10',
      topics: [
        { title: 'Real Numbers', duration: 360, completed: true, subtopics: [{ title: 'Fundamental Theorem of Arithmetic', completed: true }, { title: 'Rational and Irrational Number Proofs', completed: true }] },
        { title: 'Polynomials', duration: 300, completed: true, subtopics: [{ title: 'Geometrical Meaning of Zeroes', completed: true }, { title: 'Relationship between Zeroes & Coefficients', completed: true }] },
        { title: 'Pair of Linear Equations in Two Variables', duration: 480, completed: false, subtopics: [{ title: 'Graphical Method of Solution', completed: false }, { title: 'Algebraic Methods (Substitution, Elimination)', completed: false }] },
        { title: 'Quadratic Equations', duration: 420, completed: false, subtopics: [{ title: 'Solution by Factorisation', completed: false }, { title: 'Quadratic Formula and Nature of Roots', completed: false }] },
        { title: 'Arithmetic Progressions', duration: 360, completed: false, subtopics: [{ title: 'nth Term of an AP', completed: false }, { title: 'Sum of First n Terms of an AP', completed: false }] },
        { title: 'Introduction to Trigonometry', duration: 480, completed: false, subtopics: [{ title: 'Trigonometric Ratios of Acute Angles', completed: false }, { title: 'Trigonometric Identities', completed: false }] },
      ],
    },
    {
      title: 'Class 10 Physics',
      subject: 'Physics',
      grade: 'Class 10',
      topics: [
        { title: 'Light – Reflection and Refraction', duration: 540, completed: true, subtopics: [{ title: 'Spherical Mirrors and Mirror Formula', completed: true }, { title: 'Refraction through Glass Lenses', completed: true }] },
        { title: 'The Human Eye and the Colorful World', duration: 360, completed: false, subtopics: [{ title: 'Structure of Human Eye and Defects of Vision', completed: false }, { title: 'Dispersion and Atmospheric Refraction', completed: false }] },
        { title: 'Electricity', duration: 480, completed: false, subtopics: [{ title: "Ohm's Law and Resistance", completed: false }, { title: 'Heating Effects of Electric Current', completed: false }] },
      ],
    },
    {
      title: 'Class 10 Chemistry',
      subject: 'Chemistry',
      grade: 'Class 10',
      topics: [
        { title: 'Chemical Reactions and Equations', duration: 360, completed: true, subtopics: [{ title: 'Balanced Chemical Equations', completed: true }, { title: 'Types of Chemical Reactions', completed: true }] },
        { title: 'Acids, Bases and Salts', duration: 420, completed: false, subtopics: [{ title: 'pH Scale and Indicators', completed: false }, { title: 'Preparation and Uses of Bleaching Powder', completed: false }] },
        { title: 'Metals and Non-Metals', duration: 480, completed: false, subtopics: [{ title: 'Physical and Chemical Properties', completed: false }, { title: 'Extraction of Metals (Metallurgy)', completed: false }] },
      ],
    },
    {
      title: 'Class 9 Mathematics',
      subject: 'Mathematics',
      grade: 'Class 9',
      topics: [
        { title: 'Number Systems', duration: 420, completed: true, subtopics: [{ title: 'Irrational Numbers Representation', completed: true }, { title: 'Real Numbers and Decimal Expansions', completed: true }] },
        { title: 'Polynomials', duration: 480, completed: false, subtopics: [{ title: 'Remainder Theorem & Factor Theorem', completed: false }, { title: 'Algebraic Identities', completed: false }] },
        { title: 'Lines and Angles', duration: 360, completed: false, subtopics: [{ title: 'Parallel Lines and Transversal Properties', completed: false }] },
      ],
    },
    {
      title: 'Class 9 Biology',
      subject: 'Biology',
      grade: 'Class 9',
      topics: [
        { title: 'Cell: The Unit of Life', duration: 300, completed: true, subtopics: [{ title: 'Cell Organelles Structure and Function', completed: true }] },
        { title: 'Tissues', duration: 360, completed: false, subtopics: [{ title: 'Plant Tissues (Meristematic vs Permanent)', completed: false }, { title: 'Animal Tissues (Epithelial, Connective)', completed: false }] },
      ],
    },
    {
      title: 'Class 11 Physics',
      subject: 'Physics',
      grade: 'Class 11',
      topics: [
        { title: 'Units and Measurements', duration: 240, completed: true, subtopics: [{ title: 'Dimensional Analysis and Applications', completed: true }] },
        { title: 'Motion in a Straight Line', duration: 360, completed: true, subtopics: [{ title: 'Uniformly Accelerated Motion Equations', completed: true }] },
        { title: 'Laws of Motion', duration: 480, completed: false, subtopics: [{ title: "Newton's Laws and Circular Motion", completed: false }] },
      ],
    },
    {
      title: 'Class 11 Chemistry',
      subject: 'Chemistry',
      grade: 'Class 11',
      topics: [
        { title: 'Some Basic Concepts of Chemistry', duration: 360, completed: true, subtopics: [{ title: 'Mole Concept and Stoichiometry', completed: true }] },
        { title: 'Structure of Atom', duration: 420, completed: false, subtopics: [{ title: "Bohr's Model and Quantum Numbers", completed: false }] },
      ],
    },
    {
      title: 'Class 12 Mathematics',
      subject: 'Mathematics',
      grade: 'Class 12',
      topics: [
        { title: 'Matrices', duration: 360, completed: true, subtopics: [{ title: 'Types of Matrices and Operations', completed: true }] },
        { title: 'Determinants', duration: 420, completed: true, subtopics: [{ title: 'Adjoint and Inverse of a Matrix', completed: true }] },
        { title: 'Continuity and Differentiability', duration: 540, completed: false, subtopics: [{ title: 'Chain Rule and Logarithmic Differentiation', completed: false }] },
      ],
    },
    {
      title: 'Class 12 Physics',
      subject: 'Physics',
      grade: 'Class 12',
      topics: [
        { title: 'Electric Charges and Fields', duration: 480, completed: true, subtopics: [{ title: "Coulomb's Law and Gauss's Theorem", completed: true }] },
        { title: 'Electrostatic Potential and Capacitance', duration: 420, completed: false, subtopics: [{ title: 'Capacitance of Parallel Plate Capacitor', completed: false }] },
      ],
    },
  ];

  for (const sDef of syllabusDefs) {
    const existing = await prisma.syllabus.findFirst({ where: { title: sDef.title, userId: USER_ID } });
    if (existing) {
      console.log(`⏭️  Syllabus "${sDef.title}" already exists, skipping`);
      continue;
    }

    await prisma.syllabus.create({
      data: {
        title: sDef.title,
        subject: sDef.subject,
        grade: sDef.grade,
        status: 'active',
        userId: USER_ID,
        topics: {
          create: sDef.topics.map((t, idx) => ({
            title: t.title,
            duration: t.duration,
            completed: t.completed,
            topicOrder: idx,
            subtopics: {
              create: t.subtopics.map((s, sidx) => ({
                title: s.title,
                completed: s.completed,
                topicOrder: sidx,
              })),
            },
          })),
        },
      },
    });
    console.log(`✅ Syllabus: ${sDef.title}`);
  }

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
