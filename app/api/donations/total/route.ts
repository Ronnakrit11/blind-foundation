import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { paymentTransactions } from '@/lib/db/schema';
import { eq, sql, or, and, isNotNull } from 'drizzle-orm';

export async function GET() {
  try {
    // Get donation summary statistics - count all successful transactions
    const [result] = await db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`COALESCE(sum(CAST(${paymentTransactions.total} AS DECIMAL(10,2))), 0)`,
      })
      .from(paymentTransactions)
      .where(
        eq(paymentTransactions.status, 'CP'),
      );

    console.log('Total donations fetched:', result.totalAmount);
    
    return NextResponse.json({
      total: result.totalAmount || '0',
    });
  } catch (error) {
    console.error('Error fetching total donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch total donations' },
      { status: 500 }
    );
  }
}
