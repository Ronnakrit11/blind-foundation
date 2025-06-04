import { db } from '@/lib/db/drizzle';
import { paymentTransactions } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

async function updateDonationRecords() {
  console.log('Starting donation records update...');
  
  try {
    // Get all payment transactions where amount is null or 0 but total has a value
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(
        isNull(paymentTransactions.amount) || 
        eq(paymentTransactions.amount, '0')
      );
    
    console.log(`Found ${transactions.length} transactions to update`);
    
    // Update each transaction
    for (const transaction of transactions) {
      if (transaction.total && parseFloat(transaction.total) > 0) {
        console.log(`Updating transaction ${transaction.id} with amount ${transaction.total}`);
        
        await db
          .update(paymentTransactions)
          .set({
            amount: transaction.total,
          })
          .where(eq(paymentTransactions.id, transaction.id));
      }
    }
    
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating donation records:', error);
  }
}

// Run the update function
updateDonationRecords()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
