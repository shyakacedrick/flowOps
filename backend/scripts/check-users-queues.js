import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const User = (await import('../src/models/User.js')).default;
const Queue = (await import('../src/models/Queue.js')).default;
const Org = (await import('../src/models/Organization.js')).default;

const users = await User.find({ role: 'business_owner' })
  .select('email name role organizationId').limit(10);
console.log('=== Business Owners ===');
for (const u of users) {
  const queues = await Queue.find({ organizationId: u.organizationId, deletedAt: null });
  const org = await Org.findById(u.organizationId);
  console.log(`User: ${u.email} | orgId: ${u.organizationId} | orgName: ${org?.name || 'NO ORG'} | queues: ${queues.length}`);
  for (const q of queues) {
    console.log(`  - Queue: ${q.name} (${q.status}) [${q._id}]`);
  }
}

console.log('\n=== All Queues ===');
const allQueues = await Queue.find({ deletedAt: null }).limit(20);
for (const q of allQueues) {
  console.log(`${q.name} | org: ${q.organizationId} | status: ${q.status}`);
}

await mongoose.disconnect();
