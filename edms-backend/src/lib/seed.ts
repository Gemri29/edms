import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set in your .env file')

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const hash = await bcrypt.hash('Admin@1234!', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@company.ae' },
    update: {},
    create: {
      email: 'superadmin@company.ae',
      passwordHash: hash,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      mustChangePw: true,
    },
  })

  console.log('✅ Super Admin created!')
  console.log('   Email:    ', superAdmin.email)
  console.log('   Password: ', 'Admin@1234!')
  console.log('   Role:     ', superAdmin.role)
  console.log('')
  console.log('⚠️  Change this password immediately after first login.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })