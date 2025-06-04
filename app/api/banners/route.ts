import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { banners } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all active banners ordered by position
    const activeBanners = await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(banners.position);

    if (activeBanners.length === 0) {
      // Return default banner if no active banners are found
      return NextResponse.json([{
        imageUrl: '/templeimage.jpeg',
        altText: 'Temple Donation',
        title: 'Default Banner'
      }]);
    }

    return NextResponse.json(activeBanners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
