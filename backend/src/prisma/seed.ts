import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:@localhost:5432/eventflow',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Admin user ───────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedAdmin,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@eventflow.com',
      phone: '0000000000',
      address: 'Admin Street 1',
      city: 'Athens',
      country: 'Greece',
      vatNumber: '000000000',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });
  console.log('✓ Admin user seeded');

  // ─── Demo organizer ───────────────────────────────────────
  const hashedOrg = await bcrypt.hash('demo1234', 10);
  const organizer = await prisma.user.upsert({
    where: { username: 'organizer1' },
    update: {},
    create: {
      username: 'organizer1',
      password: hashedOrg,
      firstName: 'Organizer',
      lastName: 'Demo',
      email: 'organizer@eventflow.com',
      phone: '6900000001',
      address: 'Ermou 10',
      city: 'Athens',
      country: 'Greece',
      vatNumber: '111111111',
      role: 'ORGANIZER',
      status: 'APPROVED',
    },
  });
  console.log('✓ Organizer user seeded');

  // ─── Demo participant ─────────────────────────────────────
  const hashedPart = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where: { username: 'participant1' },
    update: {},
    create: {
      username: 'participant1',
      password: hashedPart,
      firstName: 'Participant',
      lastName: 'Demo',
      email: 'participant@eventflow.com',
      phone: '6900000002',
      address: 'Stadiou 5',
      city: 'Athens',
      country: 'Greece',
      vatNumber: '222222222',
      role: 'PARTICIPANT',
      status: 'APPROVED',
    },
  });
  console.log('✓ Participant user seeded');

  // ─── Demo events ──────────────────────────────────────────
  const events = [
    {
      eventId: 'EV' + Date.now() + '1',
      title: 'Athens Jazz Festival',
      eventType: 'Concert',
      venue: 'Technopolis',
      address: 'Pireos 100',
      city: 'Athens',
      country: 'Greece',
      geoLat: 37.9784,
      geoLng: 23.7182,
      startDateTime: new Date('2026-08-15T20:00:00'),
      endDateTime: new Date('2026-08-15T23:30:00'),
      capacity: 500,
      status: 'PUBLISHED' as const,
      description: 'An evening of world-class jazz featuring acclaimed Greek and international musicians at the iconic Technopolis venue in Gazi.',
      categories: ['Music', 'Jazz', 'Live Performance'],
      ticketTypes: [
        { name: 'General Admission', price: 25, quantity: 350 },
        { name: 'VIP', price: 60, quantity: 100 },
        { name: 'Student', price: 15, quantity: 50 },
      ],
    },
    {
      eventId: 'EV' + Date.now() + '2',
      title: 'Web Development Summit 2026',
      eventType: 'Conference',
      venue: 'Athens Convention Center',
      address: 'Leoforos Syggrou 385',
      city: 'Athens',
      country: 'Greece',
      geoLat: 37.9524,
      geoLng: 23.7196,
      startDateTime: new Date('2026-09-10T09:00:00'),
      endDateTime: new Date('2026-09-10T18:00:00'),
      capacity: 300,
      status: 'PUBLISHED' as const,
      description: 'A full-day conference covering the latest trends in web development including React, Node.js, TypeScript, and cloud architecture. Featuring 12 speakers from top tech companies.',
      categories: ['Technology', 'Programming', 'Networking'],
      ticketTypes: [
        { name: 'Standard', price: 80, quantity: 200 },
        { name: 'Early Bird', price: 55, quantity: 80 },
        { name: 'Workshop Pass', price: 120, quantity: 20 },
      ],
    },
    {
      eventId: 'EV' + Date.now() + '3',
      title: 'Yoga & Wellness Retreat',
      eventType: 'Workshop',
      venue: 'National Garden',
      address: 'Leoforos Vasilisis Amalias',
      city: 'Athens',
      country: 'Greece',
      geoLat: 37.9733,
      geoLng: 23.7393,
      startDateTime: new Date('2026-07-20T08:00:00'),
      endDateTime: new Date('2026-07-20T13:00:00'),
      capacity: 80,
      status: 'PUBLISHED' as const,
      description: 'A morning of guided yoga, meditation, and wellness workshops in the heart of Athens. Suitable for all levels. Bring your own mat.',
      categories: ['Wellness', 'Sports', 'Lifestyle'],
      ticketTypes: [
        { name: 'Full Session', price: 20, quantity: 60 },
        { name: 'Drop-in', price: 12, quantity: 20 },
      ],
    },
    {
      eventId: 'EV' + Date.now() + '4',
      title: 'Greek Street Food Festival',
      eventType: 'Festival',
      venue: 'Monastiraki Square',
      address: 'Monastiraki Square',
      city: 'Athens',
      country: 'Greece',
      geoLat: 37.9755,
      geoLng: 23.7257,
      startDateTime: new Date('2026-08-01T12:00:00'),
      endDateTime: new Date('2026-08-03T22:00:00'),
      capacity: 1000,
      status: 'PUBLISHED' as const,
      description: 'Three days celebrating the best of Greek street food culture. Over 40 vendors, live music, cooking demonstrations, and family activities at the heart of Athens.',
      categories: ['Food', 'Culture', 'Family'],
      ticketTypes: [
        { name: 'Day Pass', price: 5, quantity: 800 },
        { name: 'Weekend Pass', price: 12, quantity: 200 },
      ],
    },
    {
      eventId: 'EV' + Date.now() + '5',
      title: 'Electronic Music Night',
      eventType: 'Concert',
      venue: 'Fuzz Club',
      address: 'Pireos 209',
      city: 'Athens',
      country: 'Greece',
      geoLat: 37.9636,
      geoLng: 23.7101,
      startDateTime: new Date('2026-07-25T23:00:00'),
      endDateTime: new Date('2026-07-26T06:00:00'),
      capacity: 600,
      status: 'PUBLISHED' as const,
      description: 'A night of cutting-edge electronic music featuring three international DJs and two local acts. Expect techno, house, and experimental sounds.',
      categories: ['Music', 'Nightlife', 'Electronic'],
      ticketTypes: [
        { name: 'Presale', price: 18, quantity: 400 },
        { name: 'Door', price: 25, quantity: 200 },
      ],
    },
    {
      eventId: 'EV' + Date.now() + '6',
      title: 'Startup Pitch Night',
      eventType: 'Networking',
      venue: 'Impact Hub Athens',
      address: 'Karaoli & Dimitriou 3',
      city: 'Athens',
      country: 'Greece',
      geoLat: 37.9838,
      geoLng: 23.7275,
      startDateTime: new Date('2026-09-18T18:00:00'),
      endDateTime: new Date('2026-09-18T21:00:00'),
      capacity: 120,
      status: 'PUBLISHED' as const,
      description: 'Eight startups pitch to a panel of investors and industry experts. Open to entrepreneurs, investors, and anyone interested in the Greek startup ecosystem.',
      categories: ['Business', 'Technology', 'Networking'],
      ticketTypes: [
        { name: 'Attendee', price: 0, quantity: 100 },
        { name: 'Pitcher', price: 0, quantity: 20 },
      ],
    },
  ];

  for (const eventData of events) {
    const { categories, ticketTypes, ...eventFields } = eventData;

    // Create or get categories
    const categoryRecords = await Promise.all(
      categories.map((name) =>
        prisma.category.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    // Create event
    const event = await prisma.event.create({
      data: {
        ...eventFields,
        organizerId: organizer.id,
        categories: {
          create: categoryRecords.map((c) => ({ categoryId: c.id })),
        },
        ticketTypes: {
          create: ticketTypes.map((t) => ({
            ticketId: 'T' + Date.now() + Math.floor(Math.random() * 10000),
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            available: t.quantity,
          })),
        },
      },
    });

    console.log(`✓ Event seeded: ${event.title}`);
  }

  console.log('\n✅ All demo data seeded successfully');
  console.log('\nDemo accounts:');
  console.log('  Admin:       admin / admin123');
  console.log('  Organizer:   organizer1 / demo1234');
  console.log('  Participant: participant1 / demo1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());