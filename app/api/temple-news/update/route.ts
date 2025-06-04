import { NextRequest, NextResponse } from 'next/server';
import { updateTempleNews } from '@/lib/db/temple-news';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, content, thumbnailUrl } = body;

    console.log('API route received update request for news ID:', id);
    
    // Validate required fields
    if (!id || !title || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert id to number if it's a string
    const newsId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Call the database function
    const result = await updateTempleNews({
      id: newsId,
      title,
      description,
      content,
      thumbnailUrl,
    });

    // Check for errors
    if (result.error) {
      console.error('Error updating news:', result.error);
      return NextResponse.json(
        { message: result.error, details: result.details },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({ 
      message: 'News updated successfully',
      news: result.news,
      success: true 
    });
  } catch (error) {
    console.error('Exception in temple news update API:', error);
    return NextResponse.json(
      { message: 'Failed to update news', error: String(error) },
      { status: 500 }
    );
  }
}
