import { db } from "./drizzle";
import { templeProjects, users } from "./schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export async function getTempleProjectsList() {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const projectsList = await client`
      SELECT * FROM temple_projects
      ORDER BY created_at DESC
    `;
    
    return { projectsList };
  } catch (error) {
    console.error("Failed to fetch temple projects:", error);
    return { error: "Failed to fetch temple projects", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTempleProjectById(id: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const projectItems = await client`
      SELECT * FROM temple_projects
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!projectItems || projectItems.length === 0) {
      return { error: "Project not found" };
    }
    
    // Return the first (and only) item from the array
    const project = projectItems[0];
    
    return { project };
  } catch (error) {
    console.error("Failed to fetch temple project:", error);
    return { error: "Failed to fetch temple project", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTempleProjectBySlug(slug: string) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const projectItems = await client`
      SELECT * FROM temple_projects
      WHERE slug = ${slug}
      LIMIT 1
    `;
    
    if (!projectItems || projectItems.length === 0) {
      return { error: "Project not found" };
    }
    
    // Return the first (and only) item from the array
    const project = projectItems[0];
    
    return { project };
  } catch (error) {
    console.error("Failed to fetch temple project:", error);
    return { error: "Failed to fetch temple project", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function createTempleProject({
  title,
  description,
  content,
  thumbnailUrl,
  targetAmount,
  userId,
}: {
  title: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
  targetAmount: number;
  userId: number;
}) {
  try {
    // Generate a slug from the title
    let slug = slugify(title);
    
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // First, check if the table exists and get its structure
    const tableCheck = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'temple_projects'
    `;
    
    console.log('Table structure:', tableCheck);
    
    // Use the postgres client with the correct column names based on the actual table structure
    const insertResult = await client`
      INSERT INTO temple_projects (
        title, 
        slug, 
        description, 
        content, 
        thumbnail_url, 
        target_amount,
        current_amount,
        progress_percentage,
        is_active,
        created_by
      )
      VALUES (
        ${title}, 
        ${slug}, 
        ${description || null}, 
        ${content}, 
        ${thumbnailUrl || null}, 
        ${targetAmount},
        0,
        0,
        true,
        ${userId}
      )
      RETURNING *
    `;
    
    console.log('Insert result:', insertResult);
    
    // Get the inserted project item
    const project = insertResult[0];
    
    return { project };
  } catch (error) {
    console.error("Failed to create temple project:", error);
    // Return more detailed error information
    return { 
      error: "Failed to create temple project", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function updateTempleProject({
  id,
  title,
  description,
  content,
  thumbnailUrl,
  targetAmount,
  currentAmount,
  isActive,
}: {
  id: number;
  title: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
  targetAmount?: number;
  currentAmount?: number;
  isActive?: boolean;
}) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if project exists
    const existingProjectItems = await client`
      SELECT * FROM temple_projects
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!existingProjectItems || existingProjectItems.length === 0) {
      return { error: "Project not found" };
    }
    
    const existingProject = existingProjectItems[0];
    
    // Generate a new slug if title changed
    let slug = existingProject.slug;
    if (title !== existingProject.title) {
      slug = slugify(title);
      
      // Check if new slug already exists (excluding current project)
      const slugExistsItems = await client`
        SELECT * FROM temple_projects
        WHERE slug = ${slug}
        LIMIT 1
      `;
      
      // If slug exists and it's not the current project, append a random string
      if (slugExistsItems && slugExistsItems.length > 0 && slugExistsItems[0].id !== id) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }
    }
    
    // Calculate progress percentage
    let progressPercentage = existingProject.progress_percentage;
    if (targetAmount !== undefined && currentAmount !== undefined && targetAmount > 0) {
      progressPercentage = (currentAmount / targetAmount) * 100;
    } else if (targetAmount !== undefined && targetAmount > 0) {
      progressPercentage = (existingProject.current_amount / targetAmount) * 100;
    } else if (currentAmount !== undefined && existingProject.target_amount > 0) {
      progressPercentage = (currentAmount / existingProject.target_amount) * 100;
    }
    
    // Update the project item with the correct column names
    const updateResult = await client`
      UPDATE temple_projects
      SET title = ${title},
          slug = ${slug},
          description = ${description || existingProject.description},
          content = ${content},
          thumbnail_url = ${thumbnailUrl || existingProject.thumbnail_url},
          target_amount = ${targetAmount !== undefined ? targetAmount : existingProject.target_amount},
          current_amount = ${currentAmount !== undefined ? currentAmount : existingProject.current_amount},
          progress_percentage = ${progressPercentage},
          is_active = ${isActive !== undefined ? isActive : existingProject.is_active},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!updateResult || updateResult.length === 0) {
      return { error: "Failed to update project" };
    }
    
    const updatedProject = updateResult[0];
    
    return { project: updatedProject };
  } catch (error) {
    console.error("Failed to update temple project:", error);
    return { 
      error: "Failed to update temple project", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function deleteTempleProject(id: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if project exists
    const existingProjectItems = await client`
      SELECT * FROM temple_projects
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!existingProjectItems || existingProjectItems.length === 0) {
      return { error: "Project not found" };
    }
    
    // Delete the project
    await client`
      DELETE FROM temple_projects
      WHERE id = ${id}
    `;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete temple project:", error);
    return { 
      error: "Failed to delete temple project", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
