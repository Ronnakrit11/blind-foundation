import { db } from "./drizzle";
import { templeNews, users } from "./schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export async function getTempleNewsList() {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const newsList = await client`
      SELECT * FROM temple_news
      ORDER BY created_at DESC
    `;
    
    return { newsList };
  } catch (error) {
    console.error("Failed to fetch temple news:", error);
    return { error: "Failed to fetch temple news", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTempleNewsById(id: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const newsItems = await client`
      SELECT * FROM temple_news
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!newsItems || newsItems.length === 0) {
      return { error: "News not found" };
    }
    
    // Return the first (and only) item from the array
    const news = newsItems[0];
    
    return { news };
  } catch (error) {
    console.error("Failed to fetch temple news:", error);
    return { error: "Failed to fetch temple news", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTempleNewsBySlug(slug: string) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const newsItems = await client`
      SELECT * FROM temple_news
      WHERE slug = ${slug}
      LIMIT 1
    `;
    
    if (!newsItems || newsItems.length === 0) {
      return { error: "News not found" };
    }
    
    // Return the first (and only) item from the array
    const news = newsItems[0];
    
    return { news };
  } catch (error) {
    console.error("Failed to fetch temple news:", error);
    return { error: "Failed to fetch temple news", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function createTempleNews({
  title,
  description,
  content,
  thumbnailUrl,
  userId,
  customSlug,
}: {
  title: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
  userId: number;
  customSlug?: string;
}) {
  try {
    // Generate a slug from the title or use custom slug if provided
    let slug = customSlug ? slugify(customSlug) : slugify(title);
    
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // First, check if the table exists and get its structure
    const tableCheck = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'temple_news'
    `;
    
    console.log('Table structure:', tableCheck);
    
    // Use the postgres client with the correct column names based on the actual table structure
    const insertResult = await client`
      INSERT INTO temple_news (
        title, 
        slug, 
        description, 
        content, 
        thumbnail_url, 
        created_by
      )
      VALUES (
        ${title}, 
        ${slug}, 
        ${description || null}, 
        ${content}, 
        ${thumbnailUrl || null}, 
        ${userId}
      )
      RETURNING *
    `;
    
    console.log('Insert result:', insertResult);
    
    // Get the inserted news item
    const news = insertResult[0];
    
    return { news };
  } catch (error) {
    console.error("Failed to create temple news:", error);
    // Return more detailed error information
    return { 
      error: "Failed to create temple news", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function updateTempleNews({
  id,
  title,
  description,
  content,
  thumbnailUrl,
}: {
  id: number;
  title: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
}) {
  // Validate input parameters
  if (!id || id <= 0) {
    console.error('Invalid ID provided for updateTempleNews:', id);
    return { error: "Invalid news ID" };
  }

  if (!title || !content) {
    console.error('Missing required fields for updateTempleNews');
    return { error: "Missing required fields" };
  }

  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if news exists
    const existingNewsItems = await client`
      SELECT * FROM temple_news
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!existingNewsItems || existingNewsItems.length === 0) {
      console.error('News not found with ID:', id);
      return { error: "News not found" };
    }
    
    const existingNews = existingNewsItems[0];
    console.log('Found news to update:', existingNews.id, existingNews.title);
    
    // Generate a new slug if title changed
    let slug = existingNews.slug;
    if (title !== existingNews.title) {
      slug = slugify(title);
      console.log('Generated new slug:', slug);
      
      // Check if new slug already exists (excluding current news)
      const slugExistsItems = await client`
        SELECT * FROM temple_news
        WHERE slug = ${slug} AND id <> ${id}
        LIMIT 1
      `;
      
      // If slug exists and it's not the current news, append a random string
      if (slugExistsItems && slugExistsItems.length > 0) {
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        slug = `${slug}-${randomSuffix}`;
        console.log('Added random suffix to slug:', slug);
      }
    }
    
    // Single update query with proper timestamp update
    console.log('Performing update with values:', {
      id,
      title,
      slug,
      description: description || null,
      content: content.substring(0, 20) + '...',
      thumbnailUrl: thumbnailUrl || null
    });
    
    try {
      // First update the basic text fields
      const updateResult = await client`
        UPDATE temple_news
        SET 
          title = ${title},
          slug = ${slug},
          description = ${description || null},
          content = ${content},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (!updateResult || updateResult.length === 0) {
        console.error('Update query returned no results');
        return { error: "Failed to update news" };
      }
      
      // Update image separately to avoid potential issues
      // Convert empty string to null for proper database storage
      if (thumbnailUrl !== undefined) {
        const imageUrlValue = thumbnailUrl === '' ? null : thumbnailUrl;
        console.log('Updating image URL to:', imageUrlValue);
        
        await client`
          UPDATE temple_news
          SET thumbnail_url = ${imageUrlValue}
          WHERE id = ${id}
        `;
      }
      
      // Get the fully updated record
      const updatedNews = await client`
        SELECT * FROM temple_news
        WHERE id = ${id}
        LIMIT 1
      `;
      
      console.log('Update successful, returning news with ID:', id);
      return { news: updatedNews[0], success: true };
      
    } catch (updateError) {
      console.error('Database error during update:', updateError);
      return { 
        error: "Database update error", 
        details: updateError instanceof Error ? updateError.message : String(updateError) 
      };
    }
  } catch (error) {
    console.error("Failed to update temple news:", error);
    return { 
      error: "Failed to update temple news", 
      details: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function deleteTempleNews(id: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if news exists
    const existingNewsItems = await client`
      SELECT * FROM temple_news
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!existingNewsItems || existingNewsItems.length === 0) {
      return { error: "News not found" };
    }
    
    // Delete the news item
    await client`
      DELETE FROM temple_news
      WHERE id = ${id}
    `;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete temple news:", error);
    return { error: "Failed to delete temple news", details: error instanceof Error ? error.message : String(error) };
  }
}
