import { db } from '@/lib/db/drizzle';
import { paymentTransactions, templeProjects } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function updateProjectIds() {
  console.log('Starting project ID update for donations...');
  
  try {
    // Get all payment transactions where projectId is null but productDetail contains project information
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(isNull(paymentTransactions.projectId));
    
    console.log(`Found ${transactions.length} transactions to check for project IDs`);
    
    // Get all temple projects for reference
    const projects = await db.select().from(templeProjects);
    console.log(`Found ${projects.length} temple projects for reference`);
    
    let updatedCount = 0;
    
    // Update each transaction
    for (const transaction of transactions) {
      if (transaction.productDetail) {
        let projectId = null;
        
        // Try to extract project ID using different patterns
        const splitByUnderscore = transaction.productDetail.split("_");
        if (splitByUnderscore.length > 1) {
          const potentialId = splitByUnderscore[1];
          if (potentialId && potentialId !== "general" && !isNaN(parseInt(potentialId))) {
            projectId = parseInt(potentialId);
          }
        } else {
          // Try to find a number in the product detail
          const matches = transaction.productDetail.match(/\\d+/);
          if (matches && matches.length > 0) {
            projectId = parseInt(matches[0]);
          }
        }
        
        // Verify that the project ID exists
        if (projectId) {
          const projectExists = projects.some(p => p.id === projectId);
          if (projectExists) {
            console.log(`Updating transaction ${transaction.id} with project ID ${projectId}`);
            
            await db
              .update(paymentTransactions)
              .set({
                projectId: projectId,
              })
              .where(eq(paymentTransactions.id, transaction.id));
            
            updatedCount++;
          }
        }
      }
    }
    
    console.log(`Updated ${updatedCount} transactions with project IDs`);
  } catch (error) {
    console.error('Error updating project IDs:', error);
  }
}

// Run the update function
updateProjectIds()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
