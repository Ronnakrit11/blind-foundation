import { NextResponse } from 'next/server';
import { getTempleNewsBySlug } from '@/lib/db/temple-news';

// Create a simple API endpoint for fetching temple news by slug
export function GET(request: Request, context: any) {
  return fetchNewsBySlug(context.params.slug);
}

// Helper function to fetch news by slug
async function fetchNewsBySlug(slug: string) {
  try {
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const { news, error } = await getTempleNewsBySlug(slug);
    
    if (error) {
      return NextResponse.json({ error }, { status: 404 });
    }

    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error fetching temple news by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temple news' },
      { status: 500 }
    );
  }
}
