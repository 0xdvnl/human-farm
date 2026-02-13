const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'human-farm.db'));

const hashPassword = (password) => bcrypt.hashSync(password, 10);

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

// Clear existing data
db.exec('DELETE FROM reviews');
db.exec('DELETE FROM task_completions');
db.exec('DELETE FROM messages');
db.exec('DELETE FROM task_applications');
db.exec('DELETE FROM tasks');
db.exec('DELETE FROM human_profiles');
db.exec('DELETE FROM agent_profiles');
db.exec('DELETE FROM users');

// Insert humans
const insertUser = db.prepare(`
  INSERT INTO users (id, type, email, password_hash)
  VALUES (?, ?, ?, ?)
`);

const insertHumanProfile = db.prepare(`
  INSERT INTO human_profiles (user_id, display_name, bio, hourly_rate_usd, location_city, location_country, skills, verification_level, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

for (const human of humans) {
  const userId = uuidv4();
  insertUser.run(userId, 'human', human.email, hashPassword(human.password));
  insertHumanProfile.run(
    userId,
    human.display_name,
    human.bio,
    human.hourly_rate_usd,
    human.location_city,
    human.location_country,
    JSON.stringify(human.skills),
    Math.floor(Math.random() * 3) // Random verification level 0-2
  );
  console.log(`Created human: ${human.display_name} (${human.email})`);
}

// Insert agent
const agentId = uuidv4();
const apiKey = `hf_${uuidv4().replace(/-/g, '')}`;

insertUser.run(agentId, 'agent', agent.email, hashPassword(agent.password));
db.prepare(`
  INSERT INTO agent_profiles (user_id, name, description, api_key)
  VALUES (?, ?, ?, ?)
`).run(agentId, agent.name, agent.description, apiKey);

console.log(`Created agent: ${agent.name} (${agent.email})`);
console.log(`API Key: ${apiKey}`);

// Create a sample task
const taskId = uuidv4();
db.prepare(`
  INSERT INTO tasks (id, agent_id, title, description, category, status, budget_usd, platform_fee_usd, deadline, location_required, location_address)
  VALUES (?, ?, ?, ?, ?, 'open', ?, ?, datetime('now', '+7 days'), 1, ?)
`).run(
  taskId,
  agentId,
  'Photograph storefront at 123 Main St',
  'Take 10 high-quality photos of the storefront from various angles. Include close-ups of signage and entrance. Natural lighting preferred.',
  'photography',
  50,
  2.5,
  '123 Main St, San Francisco, CA'
);

console.log(`Created sample task: ${taskId}`);

console.log('\n✅ Database seeded successfully!');
console.log('\nTest accounts:');
console.log('- Human: alex@example.com / password123');
console.log('- Agent: agent@example.com / password123');
console.log(`- Agent API Key: ${apiKey}`);
