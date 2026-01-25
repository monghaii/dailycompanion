#!/usr/bin/env node

/**
 * Coach Subscription Manager - Development Tool
 * 
 * Usage:
 *   node scripts/manage-coach-subscription.js <slug> <action>
 * 
 * Actions:
 *   activate   - Set subscription to active (bypass payment)
 *   deactivate - Set subscription to inactive
 *   status     - View current subscription status
 * 
 * Examples:
 *   node scripts/manage-coach-subscription.js twinleaf activate
 *   node scripts/manage-coach-subscription.js twinleaf deactivate
 *   node scripts/manage-coach-subscription.js twinleaf status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCoachBySlug(slug) {
  const { data, error } = await supabase
    .from('coaches')
    .select(`
      *,
      profiles:profile_id (
        email,
        full_name
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

async function activateCoach(slug) {
  const coach = await getCoachBySlug(slug);
  
  if (!coach) {
    console.error(`❌ Coach with slug "${slug}" not found`);
    return;
  }

  const { error } = await supabase
    .from('coaches')
    .update({
      platform_subscription_status: 'active',
      is_active: true,
      setup_fee_paid: true,
      setup_fee_paid_at: new Date().toISOString(),
      setup_fee_amount_cents: 50000, // $500
    })
    .eq('id', coach.id);

  if (error) {
    console.error('❌ Error activating coach:', error.message);
    return;
  }

  console.log('✅ Coach subscription ACTIVATED');
  console.log(`   Coach: ${coach.business_name}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Email: ${coach.profiles.email}`);
  console.log(`   Status: active`);
  console.log(`   Setup Fee: marked as paid`);
}

async function deactivateCoach(slug) {
  const coach = await getCoachBySlug(slug);
  
  if (!coach) {
    console.error(`❌ Coach with slug "${slug}" not found`);
    return;
  }

  const { error } = await supabase
    .from('coaches')
    .update({
      platform_subscription_status: 'inactive',
      is_active: false,
    })
    .eq('id', coach.id);

  if (error) {
    console.error('❌ Error deactivating coach:', error.message);
    return;
  }

  console.log('✅ Coach subscription DEACTIVATED');
  console.log(`   Coach: ${coach.business_name}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Email: ${coach.profiles.email}`);
  console.log(`   Status: inactive`);
}

async function showStatus(slug) {
  const coach = await getCoachBySlug(slug);
  
  if (!coach) {
    console.error(`❌ Coach with slug "${slug}" not found`);
    return;
  }

  console.log('📊 Coach Subscription Status');
  console.log('─'.repeat(50));
  console.log(`Business Name: ${coach.business_name}`);
  console.log(`Slug: ${coach.slug}`);
  console.log(`Email: ${coach.profiles.email}`);
  console.log(`Full Name: ${coach.profiles.full_name || 'N/A'}`);
  console.log('─'.repeat(50));
  console.log(`Subscription Status: ${coach.platform_subscription_status}`);
  console.log(`Is Active: ${coach.is_active ? '✅' : '❌'}`);
  console.log(`Setup Fee Paid: ${coach.setup_fee_paid ? '✅' : '❌'}`);
  console.log(`Stripe Customer ID: ${coach.stripe_customer_id || 'N/A'}`);
  console.log(`Stripe Subscription ID: ${coach.platform_subscription_id || 'N/A'}`);
  console.log(`Stripe Connect Status: ${coach.stripe_account_status || 'N/A'}`);
  console.log('─'.repeat(50));
}

async function listAllCoaches() {
  const { data: coaches, error } = await supabase
    .from('coaches')
    .select(`
      slug,
      business_name,
      platform_subscription_status,
      is_active,
      profiles:profile_id (
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching coaches:', error.message);
    return;
  }

  console.log('\n📋 All Coaches');
  console.log('═'.repeat(80));
  console.log(`${'Slug'.padEnd(20)} ${'Business Name'.padEnd(25)} ${'Status'.padEnd(12)} ${'Email'}`);
  console.log('─'.repeat(80));
  
  coaches.forEach(coach => {
    const statusIcon = coach.is_active ? '✅' : '❌';
    const status = `${statusIcon} ${coach.platform_subscription_status}`;
    console.log(
      `${coach.slug.padEnd(20)} ${coach.business_name.padEnd(25)} ${status.padEnd(12)} ${coach.profiles.email}`
    );
  });
  console.log('═'.repeat(80));
  console.log(`Total: ${coaches.length} coaches\n`);
}

async function main() {
  const [slug, action] = process.argv.slice(2);

  if (!slug && !action) {
    console.log('🔧 Coach Subscription Manager\n');
    console.log('Usage:');
    console.log('  node scripts/manage-coach-subscription.js <slug> <action>');
    console.log('  node scripts/manage-coach-subscription.js list\n');
    console.log('Actions:');
    console.log('  activate   - Set subscription to active (bypass payment)');
    console.log('  deactivate - Set subscription to inactive');
    console.log('  status     - View current subscription status');
    console.log('  list       - List all coaches\n');
    console.log('Examples:');
    console.log('  node scripts/manage-coach-subscription.js twinleaf activate');
    console.log('  node scripts/manage-coach-subscription.js twinleaf deactivate');
    console.log('  node scripts/manage-coach-subscription.js twinleaf status');
    console.log('  node scripts/manage-coach-subscription.js list\n');
    process.exit(0);
  }

  if (slug === 'list') {
    await listAllCoaches();
    return;
  }

  if (!action) {
    console.error('❌ Error: Action is required');
    console.log('Actions: activate, deactivate, status');
    process.exit(1);
  }

  switch (action.toLowerCase()) {
    case 'activate':
    case 'promote':
      await activateCoach(slug);
      break;
    
    case 'deactivate':
    case 'demote':
      await deactivateCoach(slug);
      break;
    
    case 'status':
    case 'show':
    case 'info':
      await showStatus(slug);
      break;
    
    default:
      console.error(`❌ Unknown action: ${action}`);
      console.log('Valid actions: activate, deactivate, status');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
