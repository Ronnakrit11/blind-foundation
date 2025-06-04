'use server';

import { db, client } from "./drizzle";
import { templeActivities, activityParticipants, users } from "./schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export async function getTempleActivitiesList() {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const activitiesList = await client`
      SELECT * FROM temple_activities
      ORDER BY start_date_time ASC
    `;
    
    return { activitiesList };
  } catch (error) {
    console.error("Failed to fetch temple activities:", error);
    return { error: "Failed to fetch temple activities", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getUpcomingTempleActivities(limit: number = 5) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Get current date
    const now = new Date();
    
    // Use the postgres client to get upcoming activities
    const activitiesList = await client`
      SELECT * FROM temple_activities
      WHERE start_date_time >= ${now} AND is_active = true
      ORDER BY start_date_time ASC
      LIMIT ${limit}
    `;
    
    return { activitiesList };
  } catch (error) {
    console.error("Failed to fetch upcoming temple activities:", error);
    return { error: "Failed to fetch upcoming temple activities", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTempleActivityById(id: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client directly with the correct column names
    const activityItems = await client`
      SELECT * FROM temple_activities
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!activityItems || activityItems.length === 0) {
      return { error: "Activity not found" };
    }
    
    // Return the first (and only) item from the array
    const activity = activityItems[0];
    
    return { activity };
  } catch (error) {
    console.error("Failed to fetch temple activity:", error);
    return { error: "Failed to fetch temple activity", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function getActivityParticipants(activityId: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Use the postgres client to get participants with user details
    const participants = await client`
      SELECT ap.*, u.name, u.email, u.phone
      FROM activity_participants ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.activity_id = ${activityId}
      ORDER BY ap.registered_at DESC
    `;
    
    return { participants };
  } catch (error) {
    console.error("Failed to fetch activity participants:", error);
    return { error: "Failed to fetch activity participants", details: error instanceof Error ? error.message : String(error) };
  }
}

export async function createTempleActivity({
  title,
  description,
  content,
  location,
  startDateTime,
  endDateTime,
  thumbnailUrl,
  maxParticipants,
  userId,
}: {
  title: string;
  description?: string;
  content: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  thumbnailUrl?: string;
  maxParticipants?: number;
  userId: number;
}) {
  try {
    // Use the Drizzle ORM approach instead of raw SQL
    const insertResult = await db.insert(templeActivities).values({
      title,
      description: description || null,
      content,
      location: location || null,
      startDateTime,
      endDateTime,
      thumbnailUrl: thumbnailUrl || null,
      maxParticipants: maxParticipants || null,
      isActive: true,
      createdBy: userId
    }).returning();
    
    console.log('Insert result:', insertResult);
    
    // Get the inserted activity item
    const activity = insertResult[0];
    
    return { activity };
  } catch (error) {
    console.error("Failed to create temple activity:", error);
    // Return more detailed error information
    return { 
      error: "Failed to create temple activity", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function updateTempleActivity({
  id,
  title,
  description,
  content,
  location,
  startDateTime,
  endDateTime,
  thumbnailUrl,
  maxParticipants,
  isActive,
}: {
  id: number;
  title: string;
  description?: string;
  content: string;
  location?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  thumbnailUrl?: string;
  maxParticipants?: number;
  isActive?: boolean;
}) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if activity exists
    const existingActivityItems = await client`
      SELECT * FROM temple_activities
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!existingActivityItems || existingActivityItems.length === 0) {
      return { error: "Activity not found" };
    }
    
    const existingActivity = existingActivityItems[0];
    
    // Update the activity item with the correct column names
    const updateResult = await client`
      UPDATE temple_activities
      SET title = ${title},
          description = ${description || existingActivity.description},
          content = ${content},
          location = ${location || existingActivity.location},
          start_date_time = ${startDateTime || existingActivity.start_date_time},
          end_date_time = ${endDateTime || existingActivity.end_date_time},
          thumbnail_url = ${thumbnailUrl !== undefined ? thumbnailUrl : existingActivity.thumbnail_url},
          max_participants = ${maxParticipants !== undefined ? maxParticipants : existingActivity.max_participants},
          is_active = ${isActive !== undefined ? isActive : existingActivity.is_active},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!updateResult || updateResult.length === 0) {
      return { error: "Failed to update activity" };
    }
    
    const updatedActivity = updateResult[0];
    
    return { activity: updatedActivity };
  } catch (error) {
    console.error("Failed to update temple activity:", error);
    return { 
      error: "Failed to update temple activity", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function deleteTempleActivity(id: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if activity exists
    const existingActivityItems = await client`
      SELECT * FROM temple_activities
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (!existingActivityItems || existingActivityItems.length === 0) {
      return { error: "Activity not found" };
    }
    
    // First delete all participants
    await client`
      DELETE FROM activity_participants
      WHERE activity_id = ${id}
    `;
    
    // Then delete the activity
    await client`
      DELETE FROM temple_activities
      WHERE id = ${id}
    `;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete temple activity:", error);
    return { 
      error: "Failed to delete temple activity", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function registerForActivity(activityId: number, userId: number, notes?: string) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if activity exists and is active
    const activityItems = await client`
      SELECT * FROM temple_activities
      WHERE id = ${activityId} AND is_active = true
      LIMIT 1
    `;
    
    if (!activityItems || activityItems.length === 0) {
      return { error: "Activity not found or not active" };
    }
    
    const activity = activityItems[0];
    
    // Check if user is already registered
    const existingRegistration = await client`
      SELECT * FROM activity_participants
      WHERE activity_id = ${activityId} AND user_id = ${userId}
      LIMIT 1
    `;
    
    if (existingRegistration && existingRegistration.length > 0) {
      return { error: "You are already registered for this activity" };
    }
    
    // Check if activity is full
    if (activity.max_participants && activity.current_participants >= activity.max_participants) {
      return { error: "This activity is already full" };
    }
    
    // Register user for activity
    const registrationResult = await client`
      INSERT INTO activity_participants (
        activity_id,
        user_id,
        status,
        notes
      )
      VALUES (
        ${activityId},
        ${userId},
        'registered',
        ${notes || null}
      )
      RETURNING *
    `;
    
    // Update current participants count
    await client`
      UPDATE temple_activities
      SET current_participants = current_participants + 1
      WHERE id = ${activityId}
    `;
    
    return { 
      success: true, 
      registration: registrationResult[0]
    };
  } catch (error) {
    console.error("Failed to register for activity:", error);
    return { 
      error: "Failed to register for activity", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function cancelRegistration(activityId: number, userId: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Check if registration exists
    const registrationItems = await client`
      SELECT * FROM activity_participants
      WHERE activity_id = ${activityId} AND user_id = ${userId}
      LIMIT 1
    `;
    
    if (!registrationItems || registrationItems.length === 0) {
      return { error: "Registration not found" };
    }
    
    // Update registration status to cancelled
    await client`
      UPDATE activity_participants
      SET status = 'cancelled'
      WHERE activity_id = ${activityId} AND user_id = ${userId}
    `;
    
    // Update current participants count
    await client`
      UPDATE temple_activities
      SET current_participants = current_participants - 1
      WHERE id = ${activityId} AND current_participants > 0
    `;
    
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel registration:", error);
    return { 
      error: "Failed to cancel registration", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getUserActivities(userId: number) {
  try {
    // Import the client from drizzle.ts
    const { client } = await import('./drizzle');
    
    // Get all activities the user is registered for
    const activities = await client`
      SELECT ta.*, ap.status as registration_status, ap.registered_at
      FROM temple_activities ta
      JOIN activity_participants ap ON ta.id = ap.activity_id
      WHERE ap.user_id = ${userId} AND ap.status != 'cancelled'
      ORDER BY ta.start_date_time ASC
    `;
    
    return { activities };
  } catch (error) {
    console.error("Failed to fetch user activities:", error);
    return { 
      error: "Failed to fetch user activities", 
      details: error instanceof Error ? error.message : String(error)
    };
  }
}