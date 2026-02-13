import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'db.json');

// Simple hash function (bcrypt not needed for seed)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + 'salt').digest('hex');
};

const uuid = () => crypto.randomUUID();

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Sample humans
const humans = [
  {
    email: 'alex@example.com',
    password: 'password123',
    display_name: 'Alex Turner',
    bio: 'Experienced runner for pickups and deliveries in SF Bay Area. Fast and reliable.',
    hourly_rate_usd: 35,
    location_city: 'San Francisco',
    location_country: 'USA',
    skills: ['pickups', 'deliveries', 'driving', 'errands'],
  },
  {
    email: 'sarah@example.com',
    password: 'password123',
    display_name: 'Sarah Chen',
    bio: 'Professional photographer with 5 years experience. Specialized in real estate and product photography.',
    hourly_rate_usd: 75,
    location_city: 'Los Angeles',
    location_country: 'USA',
    skills: ['photography', 'videography', 'real_estate'],
  },
  {
    email: 'mike@example.com',
    password: 'password123',
    display_name: 'Mike Johnson',
    bio: 'IT professional available for hardware setup and technical tasks. Certified in multiple platforms.',
    hourly_rate_usd: 60,
    location_city: 'Seattle',
    location_country: 'USA',
    skills: ['hardware_setup', 'it_support', 'testing'],
  },
  {
    email: 'emma@example.com',
    password: 'password123',
    display_name: 'Emma Williams',
    bio: 'Former retail manager, expert at mystery shopping and business verification.',
    hourly_rate_usd: 40,
    location_city: 'New York',
    location_country: 'USA',
    skills: ['mystery_shopping', 'site_inspection', 'verification', 'meetings'],
  },
  {
    email: 'james@example.com',
    password: 'password123',
    display_name: 'James Park',
    bio: 'Notary public and document specialist. Available for signings and legal witnessing.',
    hourly_rate_usd: 50,
    location_city: 'Chicago',
    location_country: 'USA',
    skills: ['notary', 'verification', 'meetings'],
  },
];

// Sample agent
const agent = {
  email: 'agent@example.com',
  password: 'password123',
  name: 'Demo AI Agent',
  description: 'A demo AI agent for testing the platform',
};

console.log('Seeding database...');

// Create database structure
const db = {
  users: [],
  human_profiles: [],
  agent_profiles: [],
  tasks: [],
  task_applications: [],
  messages: [],
  task_completions: [],
  reviews: [],
};

// Insert humans
for (const human of humans) {
  const userId = uuid();

  db.users.push({
    id: userId,
    type: 'human',
    email: human.email,
    password_hash: hashPassword(human.password),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  db.human_profiles.push({
    user_id: userId,
    display_name: human.display_name,
    bio: human.bio,
    avatar_url: null,
    hourly_rate_usd: human.hourly_rate_usd,
    location_city: human.location_city,
    location_country: human.location_country,
    location_lat: null,
    location_lng: null,
    skills: human.skills,
    availability: null,
    verification_level: Math.floor(Math.random() * 3),
    total_tasks: Math.floor(Math.random() * 20),
    avg_rating: 4 + Math.random(),
    response_time_mins: Math.floor(Math.random() * 60) + 10,
    is_active: true,
    last_active_at: new Date().toISOString(),
  });

  console.log(`Created human: ${human.display_name} (${human.email})`);
}

// Insert agent
const agentId = uuid();
const apiKey = `hf_${uuid().replace(/-/g, '')}`;

db.users.push({
  id: agentId,
  type: 'agent',
  email: agent.email,
  password_hash: hashPassword(agent.password),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

db.agent_profiles.push({
  user_id: agentId,
  name: agent.name,
  description: agent.description,
  api_key: apiKey,
  total_tasks: 0,
  total_spent_usd: 0,
});

console.log(`Created agent: ${agent.name} (${agent.email})`);
console.log(`API Key: ${apiKey}`);

// Create a sample task
const taskId = uuid();
const deadline = new Date();
deadline.setDate(deadline.getDate() + 7);

db.tasks.push({
  id: taskId,
  agent_id: agentId,
  human_id: null,
  title: 'Photograph storefront at 123 Main St',
  description: 'Take 10 high-quality photos of the storefront from various angles. Include close-ups of signage and entrance. Natural lighting preferred.',
  category: 'photography',
  status: 'open',
  budget_usd: 50,
  platform_fee_usd: 2.5,
  location_required: true,
  location_lat: 37.7749,
  location_lng: -122.4194,
  location_address: '123 Main St, San Francisco, CA',
  deadline: deadline.toISOString(),
  proof_requirements: ['10 photos from different angles', 'Close-up of signage'],
  created_at: new Date().toISOString(),
  assigned_at: null,
  completed_at: null,
});

console.log(`Created sample task: ${taskId}`);

// Write database
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('\n✅ Database seeded successfully!');
console.log('\nTest accounts:');
console.log('- Human: alex@example.com / password123');
console.log('- Agent: agent@example.com / password123');
console.log(`- Agent API Key: ${apiKey}`);
