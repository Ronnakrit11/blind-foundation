'use server';

import { getTempleNewsList } from '@/lib/db/temple-news';

export async function getLatestTempleNews(limit: number = 3) {
  try {
    const { newsList, error } = await getTempleNewsList();
    
    if (error || !newsList) {
      console.error('Error fetching temple news:', error);
      return { newsList: [] };
    }
    
    // Return only the latest news items up to the limit
    return { 
      newsList: newsList.slice(0, limit) 
    };
  } catch (error) {
    console.error('Error in getLatestTempleNews:', error);
    return { newsList: [] };
  }
}
