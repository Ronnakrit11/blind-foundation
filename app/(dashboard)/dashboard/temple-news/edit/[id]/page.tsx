// This is a server component that passes the params to a client component
import { getTempleNewsById } from './actions';
import EditTempleNewsClient from './edit-client';

// Define the type that matches the TempleNewsData interface in edit-client.tsx
interface TempleNewsData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
  created_by: number;
}

export default async function EditTempleNewsPage({ params }: any) {
  // Safely parse the ID from params
  let newsId = 0;
  if (params?.id) {
    try {
      newsId = parseInt(String(params.id), 10);
      if (isNaN(newsId)) newsId = 0;
    } catch (e) {
      console.error('Error parsing news ID:', e);
      newsId = 0;
    }
  }
  
  // Fetch the news data on the server
  const result = await getTempleNewsById(newsId);
  
  // Map the database result to the expected TempleNewsData type
  let newsData: TempleNewsData | null = null;
  
  // Skip error display entirely - handle all errors on the client side
  // This prevents showing error messages when the update is successful
  
  if (result.news) {
    // Log the raw news data to see all available fields
    console.log('Raw news data:', result.news);
    console.log('Image URL field:', result.news.image_url);
    console.log('Thumbnail URL field:', result.news.thumbnail_url);
    
    newsData = {
      id: result.news.id,
      title: result.news.title,
      slug: result.news.slug,
      description: result.news.description,
      content: result.news.content,
      // Use the correct field name for the image URL
      thumbnail_url: result.news.thumbnail_url,
      created_at: result.news.created_at,
      created_by: result.news.created_by || 0
    };
  }
  
  // Pass the ID and news data to the client component
  return <EditTempleNewsClient newsId={newsId} initialData={newsData} />;
}
