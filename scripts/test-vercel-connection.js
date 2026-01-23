// Script to test Vercel API connection (Dependency-free)
const fs = require('fs');
const https = require('https');
const path = require('path');

// Helper to parse .env file
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        env[match[1].trim()] = value;
      }
    });
    return env;
  } catch (e) {
    return {};
  }
}

// Load env vars
const envLocal = loadEnv(path.join(process.cwd(), '.env.local'));
const env = loadEnv(path.join(process.cwd(), '.env'));
const mergedEnv = { ...process.env, ...env, ...envLocal };

const VERCEL_TOKEN = mergedEnv.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = mergedEnv.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = mergedEnv.VERCEL_TEAM_ID;

console.log('--- Vercel API Connection Test ---');
console.log(`VERCEL_TOKEN: ${VERCEL_TOKEN ? 'Set (length: ' + VERCEL_TOKEN.length + ')' : 'MISSING'}`);
console.log(`VERCEL_PROJECT_ID: ${VERCEL_PROJECT_ID || 'MISSING'}`);
console.log(`VERCEL_TEAM_ID: ${VERCEL_TEAM_ID || 'Not set (optional)'}`);

function request(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testConnection() {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    console.error('❌ Missing required environment variables');
    return;
  }

  try {
    console.log('\n1. Testing Project Access...');
    const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    
    const response = await request(url);

    if (response.status === 200) {
      console.log('✅ Success! Connected to project:', response.data.name);
    } else {
      console.error('❌ Failed to connect to project');
      console.error('   Status:', response.status);
      console.error('   Error:', JSON.stringify(response.data, null, 2));
      return;
    }

    console.log('\n2. Listing Domains...');
    const domainsUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const domainsResponse = await request(domainsUrl);
    
    if (domainsResponse.status === 200) {
      console.log(`✅ Success! Found ${domainsResponse.data.domains?.length || 0} domains:`);
      domainsResponse.data.domains?.forEach(d => {
        console.log(`   - ${d.name} (verified: ${d.verified})`);
      });
    } else {
      console.error('❌ Failed to list domains:', domainsResponse.data);
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

testConnection();
