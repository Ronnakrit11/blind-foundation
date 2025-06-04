import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { paymentTransactions, templeProjects } from '@/lib/db/schema';
import { eq, sql, or, and, isNotNull } from 'drizzle-orm';

export async function GET() {
  try {
    // Get completed projects count
    const [projectsResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(templeProjects)
      .where(eq(templeProjects.isActive, false)); // Completed projects are marked as inactive
    
    // Get total donors count from payment transactions - include all successful transactions
    // This counts users who have made at least one successful transaction regardless of auth method
    const [donorsResult] = await db
      .select({
        count: sql<number>`count(distinct ${paymentTransactions.userId})`,
      })
      .from(paymentTransactions)
      .where(
        or(
          eq(paymentTransactions.status, 'CP'),  // Completed status
          eq(paymentTransactions.status, 'Y'),   // Success status
          and(
            isNotNull(paymentTransactions.userId),
            or(
              eq(paymentTransactions.statusName, 'Paid'),
              eq(paymentTransactions.statusName, 'COMPLETED')
            )
          )
        )
      );
    
    // Get total donation amount from all successful transactions
    const [donationsAmountResult] = await db
      .select({
        totalAmount: sql<string>`COALESCE(sum(CAST(${paymentTransactions.total} AS DECIMAL(10,2))), 0)`,
      })
      .from(paymentTransactions)
      .where(
        or(
          eq(paymentTransactions.status, 'CP'),  // Completed status
          eq(paymentTransactions.status, 'Y'),   // Success status
          and(
            isNotNull(paymentTransactions.userId),
            or(
              eq(paymentTransactions.statusName, 'Paid'),
              eq(paymentTransactions.statusName, 'COMPLETED')
            )
          )
        )
      );
    
    // Get total donation amount across all temple projects as a backup/additional metric
    const [projectDonationsResult] = await db
      .select({
        totalAmount: sql<string>`COALESCE(sum(${templeProjects.currentAmount}), 0)`,
      })
      .from(templeProjects);
    
    // Use the transaction-based total as the primary metric
    const totalDonationAmount = donationsAmountResult.totalAmount || '0';
    
    console.log('Stats fetched:', {
      completedProjects: projectsResult.count,
      totalDonors: donorsResult.count,
      totalDonationAmount: totalDonationAmount,
      projectBasedTotal: projectDonationsResult.totalAmount
    });
    
    return NextResponse.json({
      completedProjects: projectsResult.count.toString(),
      totalDonors: donorsResult.count.toString(),
      totalDonationAmount: totalDonationAmount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
