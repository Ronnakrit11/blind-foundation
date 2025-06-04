import { db } from '@/lib/db/drizzle';
import { paymentTransactions, templeProjects } from '@/lib/db/schema';
import { eq, isNull, or, and, ne } from 'drizzle-orm';

async function fixAllDonations() {
  console.log('Starting comprehensive donation fix...');
  
  try {
    // Get all temple projects for reference
    const projects = await db.select().from(templeProjects);
    console.log(`Found ${projects.length} temple projects for reference`);
    
    // Default to the first project if available
    const defaultProjectId = projects.length > 0 ? projects[0].id : null;
    console.log(`Default project ID: ${defaultProjectId}`);
    
    // Get all payment transactions that need fixing
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(
        or(
          isNull(paymentTransactions.amount),
          eq(paymentTransactions.amount, '0'),
          eq(paymentTransactions.amount, ''),
          isNull(paymentTransactions.projectId)
        )
      );
    
    console.log(`Found ${transactions.length} transactions to fix`);
    
    let updatedAmountCount = 0;
    let updatedProjectCount = 0;
    
    // Update each transaction
    for (const transaction of transactions) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Fix amount if needed
      if (!transaction.amount || transaction.amount === '0' || transaction.amount === '') {
        if (transaction.total && parseFloat(transaction.total) > 0) {
          updates.amount = transaction.total;
          needsUpdate = true;
          updatedAmountCount++;
        }
      }
      
      // Fix project ID if needed
      if (!transaction.projectId) {
        let extractedProjectId = null;
        
        // Try to extract project ID from product detail
        if (transaction.productDetail) {
          const splitByUnderscore = transaction.productDetail.split("_");
          if (splitByUnderscore.length > 1) {
            const potentialId = splitByUnderscore[1];
            if (potentialId && potentialId !== "general" && !isNaN(parseInt(potentialId))) {
              extractedProjectId = parseInt(potentialId);
            }
          } else {
            // Try to find a number in the product detail
            const matches = transaction.productDetail.match(/\\d+/);
            if (matches && matches.length > 0) {
              extractedProjectId = parseInt(matches[0]);
            }
          }
        }
        
        // Verify that the extracted project ID exists, otherwise use default
        if (extractedProjectId) {
          const projectExists = projects.some(p => p.id === extractedProjectId);
          if (projectExists) {
            updates.projectId = extractedProjectId;
          } else if (defaultProjectId) {
            updates.projectId = defaultProjectId;
          }
        } else if (defaultProjectId) {
          updates.projectId = defaultProjectId;
        }
        
        if (updates.projectId) {
          needsUpdate = true;
          updatedProjectCount++;
        }
      }
      
      // Update the transaction if needed
      if (needsUpdate) {
        console.log(`Updating transaction ${transaction.id} with:`, updates);
        
        await db
          .update(paymentTransactions)
          .set(updates)
          .where(eq(paymentTransactions.id, transaction.id));
      }
    }
    
    console.log(`Updated ${updatedAmountCount} transactions with correct amounts`);
    console.log(`Updated ${updatedProjectCount} transactions with project IDs`);
    
  } catch (error) {
    console.error('Error fixing donations:', error);
  }
}

// Run the fix function
fixAllDonations()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
