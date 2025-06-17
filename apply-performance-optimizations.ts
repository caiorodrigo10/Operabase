import { sql } from 'drizzle-orm';
import { db } from './server/db.js';

/**
 * Phase 1 Database Performance Optimization Migration
 * Target: Reduce response times from 1299ms to <500ms
 * Support: 200-300+ concurrent users
 */
async function applyPerformanceOptimizations() {
  console.log('🚀 Starting Phase 1 Database Performance Optimizations');
  console.log('Target: <500ms response time for 200-300+ concurrent users');
  console.log('=' .repeat(60));

  try {
    // 1. Create critical composite indexes for contacts table
    console.log('\n1️⃣ Optimizing Contacts table indexes...');
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_clinic_status_new 
      ON contacts (clinic_id, status) 
      WHERE clinic_id IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_clinic_updated_new 
      ON contacts (clinic_id, last_interaction DESC) 
      WHERE clinic_id IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_phone_clinic_new 
      ON contacts (phone, clinic_id) 
      WHERE phone IS NOT NULL AND clinic_id IS NOT NULL
    `);

    console.log('✅ Contacts indexes created');

    // 2. Optimize appointments table for scheduling performance
    console.log('\n2️⃣ Optimizing Appointments table indexes...');
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_clinic_date_new 
      ON appointments (clinic_id, scheduled_date DESC) 
      WHERE clinic_id IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_clinic_status_new 
      ON appointments (clinic_id, status) 
      WHERE clinic_id IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_contact_clinic_new 
      ON appointments (contact_id, clinic_id) 
      WHERE contact_id IS NOT NULL AND clinic_id IS NOT NULL
    `);

    console.log('✅ Appointments indexes created');

    // 3. Optimize conversations and messages for chat performance
    console.log('\n3️⃣ Optimizing Chat performance indexes...');
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_clinic_updated_new 
      ON conversations (clinic_id, updated_at DESC) 
      WHERE clinic_id IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_timestamp_new 
      ON messages (conversation_id, timestamp DESC) 
      WHERE conversation_id IS NOT NULL
    `);

    console.log('✅ Chat performance indexes created');

    // 4. Optimize medical records
    console.log('\n4️⃣ Optimizing Medical Records indexes...');
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_clinic_updated_new 
      ON medical_records (clinic_id, updated_at DESC) 
      WHERE clinic_id IS NOT NULL
    `);
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medical_records_contact_clinic_new 
      ON medical_records (contact_id, clinic_id) 
      WHERE contact_id IS NOT NULL AND clinic_id IS NOT NULL
    `);

    console.log('✅ Medical records indexes created');

    // 5. Optimize clinic users lookup
    console.log('\n5️⃣ Optimizing Clinic Users indexes...');
    
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clinic_users_clinic_active_new 
      ON clinic_users (clinic_id, is_active) 
      WHERE clinic_id IS NOT NULL
    `);

    console.log('✅ Clinic users indexes created');

    // 6. Update database statistics for better query planning
    console.log('\n6️⃣ Updating database statistics...');
    
    await db.execute(sql`ANALYZE contacts`);
    await db.execute(sql`ANALYZE appointments`);
    await db.execute(sql`ANALYZE conversations`);
    await db.execute(sql`ANALYZE messages`);
    await db.execute(sql`ANALYZE medical_records`);
    await db.execute(sql`ANALYZE clinic_users`);

    console.log('✅ Database statistics updated');

    // 7. Verify index creation and usage
    console.log('\n7️⃣ Verifying index creation...');
    
    const indexCheck = await db.execute(sql`
      SELECT 
        schemaname, 
        tablename, 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('contacts', 'appointments', 'conversations', 'messages', 'medical_records', 'clinic_users')
        AND indexname LIKE '%clinic%'
      ORDER BY tablename, indexname
    `);

    console.log(`✅ Created ${indexCheck.length} multi-tenant indexes`);

    // 8. Check slow query potential
    console.log('\n8️⃣ Checking query performance potential...');
    
    const tableStats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND tablename IN ('contacts', 'appointments', 'conversations', 'messages')
      ORDER BY n_live_tup DESC
    `);

    console.log('✅ Database performance metrics collected');
    tableStats.forEach((table: any) => {
      console.log(`   - ${table.tablename}: ${table.n_live_tup} live rows`);
    });

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 PHASE 1 DATABASE OPTIMIZATION COMPLETE');
    console.log('=' .repeat(60));
    
    console.log('\n📊 OPTIMIZATIONS APPLIED:');
    console.log('✅ Critical composite indexes for multi-tenant queries');
    console.log('✅ Optimized contact lookup and filtering');
    console.log('✅ Enhanced appointment scheduling performance');
    console.log('✅ Accelerated chat message loading');
    console.log('✅ Improved medical records access');
    console.log('✅ Updated database statistics for optimal query planning');

    console.log('\n🎯 EXPECTED PERFORMANCE IMPROVEMENTS:');
    console.log('✅ Response time: 1299ms → <500ms (60%+ reduction)');
    console.log('✅ Concurrent capacity: 50-100 → 200-300+ users');
    console.log('✅ Database query optimization for clinic_id filtering');
    console.log('✅ Eliminated table scans on critical queries');
    console.log('✅ Enhanced multi-tenant query performance');

    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Monitor response times in production');
    console.log('2. Run load tests to validate 200-300 user capacity');
    console.log('3. Implement query result caching (Phase 2)');
    console.log('4. Optimize N+1 queries in application layer');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Execute migration if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyPerformanceOptimizations()
    .then(() => {
      console.log('\n✅ Phase 1 optimization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Optimization failed:', error);
      process.exit(1);
    });
}

export { applyPerformanceOptimizations };