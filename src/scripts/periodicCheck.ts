import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { runPeriodicValidation } from '@/lib/dataConsistency';
import { checkDatabaseConnection } from '@/lib/mongodb';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Set NODE_ENV if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

async function runCheck() {
  console.log('Starting periodic data consistency check...');
  console.log('Time:', new Date().toISOString());

  try {
    // First check database connection
    console.log('Checking database connection...');
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection check failed');
    }
    console.log('Database connection is healthy');

    // Run data validation
    console.log('Running data validation...');
    await runPeriodicValidation();
    console.log('Periodic check completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during periodic check:', error);
    process.exit(1);
  }
}

// Run the check
runCheck();
