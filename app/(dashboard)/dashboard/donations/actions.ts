'use server';

import { db } from '@/lib/db/drizzle';
import { paymentTransactions, users, templeProjects } from '@/lib/db/schema';
import { eq, desc, and, isNotNull, sql, between, like, or, gte, lte, isNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export interface DonationsListResult {
  donationsList?: any[];
  error?: string;
}

export interface DonationsFilter {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  status?: string;
  projectId?: string;
  method?: string;
}

export async function getDonationsList(filters?: DonationsFilter) {
  try {
    const user = await getUser();
    
    if (!user || user.role !== 'admin') {
      return {
        error: 'Unauthorized access',
      };
    }

    // Build the query conditions based on filters
    let conditions = [];
    
    // Date range filter
    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        and(
          gte(paymentTransactions.createdAt, filters.startDate),
          lte(paymentTransactions.createdAt, filters.endDate)
        )
      );
    } else if (filters?.startDate) {
      conditions.push(gte(paymentTransactions.createdAt, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(paymentTransactions.createdAt, filters.endDate));
    }
    
    // Search filter (search in customer email, user name, or user email)
    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          like(paymentTransactions.customerEmail, searchTerm),
          like(users.name, searchTerm),
          like(users.email, searchTerm),
          like(users.lineDisplayName, searchTerm)
        )
      );
    }
    
    // Status filter
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(paymentTransactions.status, filters.status));
    }
    
    // Project filter
    if (filters?.projectId && filters.projectId !== 'all') {
      if (filters.projectId === 'null') {
        conditions.push(isNull(paymentTransactions.projectId));
      } else {
        conditions.push(eq(paymentTransactions.projectId, parseInt(filters.projectId)));
      }
    }
    
    // Payment method filter
    if (filters?.method && filters.method !== 'all') {
      conditions.push(eq(paymentTransactions.method, filters.method));
    }

    // Get all payment transactions that are related to temple project donations
    // This includes transactions with a projectId or with productDetail containing "บริจาค"
    const donationsList = await db
      .select({
        id: paymentTransactions.id,
        status: paymentTransactions.status,
        statusName: paymentTransactions.statusName,
        amount: sql`COALESCE(${paymentTransactions.amount}, ${paymentTransactions.total})`,
        total: paymentTransactions.total,
        method: paymentTransactions.method,
        transRef: paymentTransactions.transRef,
        paymentDate: paymentTransactions.paymentDate,
        productDetail: paymentTransactions.productDetail,
        customerEmail: paymentTransactions.customerEmail,
        createdAt: paymentTransactions.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          lineDisplayName: users.lineDisplayName,
          lineId: users.lineId,
          authProvider: users.authProvider,
        },
        project: {
          id: templeProjects.id,
          title: templeProjects.title,
          slug: templeProjects.slug,
        },
      })
      .from(paymentTransactions)
      .leftJoin(users, eq(paymentTransactions.userId, users.id))
      .leftJoin(templeProjects, eq(paymentTransactions.projectId, templeProjects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentTransactions.createdAt));

    return { donationsList };
  } catch (error) {
    console.error('Error fetching donations:', error);
    return {
      error: 'Failed to fetch donations',
    };
  }
}

export async function getProjects() {
  try {
    const projects = await db
      .select({
        id: templeProjects.id,
        title: templeProjects.title,
      })
      .from(templeProjects)
      .orderBy(desc(templeProjects.createdAt));
    
    return { projects };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      error: 'Failed to fetch projects',
    };
  }
}