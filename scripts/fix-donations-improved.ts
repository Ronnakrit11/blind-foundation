import { db } from '@/lib/db/drizzle';
import { paymentTransactions, templeProjects } from '@/lib/db/schema';
import { eq, isNull, or, and, ne, sql } from 'drizzle-orm';

async function fixDonations() {
  console.log('Starting improved donation fix...');
  
  try {
    // Get all temple projects for reference
    const projects = await db.select().from(templeProjects);
    console.log(`Found ${projects.length} temple projects for reference`);
    
    // Default to the first project if available
    const defaultProjectId = projects.length > 0 ? projects[0].id : null;
    console.log(`Default project ID: ${defaultProjectId}`);
    
    // 1. Fix transactions with null amount but valid total
    console.log('Fixing transactions with null amount but valid total...');
    const amountResult = await db
      .update(paymentTransactions)
      .set({
        amount: sql`${paymentTransactions.total}`
      })
      .where(
        and(
          isNull(paymentTransactions.amount),
          sql`${paymentTransactions.total} IS NOT NULL`,
          sql`${paymentTransactions.total} != ''`,
          sql`${paymentTransactions.total} != '0'`
        )
      );
    
    console.log('Amount fix completed');
    
    // 2. Fix transactions with null projectId
    if (defaultProjectId) {
      console.log('Fixing transactions with null projectId...');
      const projectResult = await db
        .update(paymentTransactions)
        .set({
          projectId: defaultProjectId
        })
        .where(isNull(paymentTransactions.projectId));
      
      console.log('Project ID fix completed');
    }
    
    console.log('All fixes completed successfully');
  } catch (error) {
    console.error('Error fixing donations:', error);
  }
}

// Run the fix function
fixDonations()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
