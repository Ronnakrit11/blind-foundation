'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { banners } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { put } from '@vercel/blob';

const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  altText: z.string().optional(),
  isActive: z.string().optional(),
  position: z.string().transform(val => parseInt(val) || 0).optional(),
});

export async function getBanners() {
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return db
    .select()
    .from(banners)
    .orderBy(desc(banners.position));
}

export const createBanner = validatedActionWithUser(
  bannerSchema,
  async (data, formData, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      // Handle image upload
      const imageFile = formData.get('image');
      if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
        return { error: 'Banner image is required' };
      }

      // Upload image to Vercel Blob
      const uploadResult = await put(`banners/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`, imageFile, {
        access: 'public',
      });
      
      if (!uploadResult.url) {
        return { error: 'Failed to upload image' };
      }

      await db.insert(banners).values({
        title: data.title,
        imageUrl: uploadResult.url,
        altText: data.altText || data.title,
        isActive: data.isActive === 'true',
        position: data.position || 0,
        createdBy: user.id,
      });

      revalidatePath('/dashboard/management/banners');
      revalidatePath('/'); // Revalidate homepage to show updated banner
      return { success: 'Banner created successfully' };
    } catch (error) {
      console.error('Error creating banner:', error);
      return { error: 'Failed to create banner' };
    }
  }
);

export const updateBanner = validatedActionWithUser(
  bannerSchema.extend({ id: z.string() }),
  async (data, formData, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      const updateData: any = {
        title: data.title,
        altText: data.altText || data.title,
        isActive: data.isActive === 'true',
        position: data.position || 0,
        updatedAt: new Date(),
      };

      // Handle image upload if a new image is provided
      const imageFile = formData.get('image');
      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        // Upload image to Vercel Blob
        const uploadResult = await put(`banners/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`, imageFile, {
          access: 'public',
        });
        
        if (!uploadResult.url) {
          return { error: 'Failed to upload image' };
        }

        updateData.imageUrl = uploadResult.url;
      }

      await db
        .update(banners)
        .set(updateData)
        .where(eq(banners.id, Number(data.id)));

      revalidatePath('/dashboard/management/banners');
      revalidatePath('/'); // Revalidate homepage to show updated banner
      return { success: 'Banner updated successfully' };
    } catch (error) {
      console.error('Error updating banner:', error);
      return { error: 'Failed to update banner' };
    }
  }
);

export const deleteBanner = validatedActionWithUser(
  z.object({ id: z.string() }),
  async (data, _, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db
        .delete(banners)
        .where(eq(banners.id, Number(data.id)));

      revalidatePath('/dashboard/management/banners');
      revalidatePath('/'); // Revalidate homepage to show updated banner
      return { success: 'Banner deleted successfully' };
    } catch (error) {
      console.error('Error deleting banner:', error);
      return { error: 'Failed to delete banner' };
    }
  }
);

export const toggleBannerStatus = validatedActionWithUser(
  z.object({ 
    id: z.string(),
    isActive: z.boolean()
  }),
  async (data, formData, user) => {
    if (user.role !== 'admin') {
      return { error: 'Unauthorized' };
    }

    try {
      await db
        .update(banners)
        .set({
          isActive: data.isActive,
          updatedAt: new Date(),
        })
        .where(eq(banners.id, Number(data.id)));

      revalidatePath('/dashboard/management/banners');
      revalidatePath('/'); // Revalidate homepage to show updated banner
      return { success: `Banner ${data.isActive ? 'activated' : 'deactivated'} successfully` };
    } catch (error) {
      console.error('Error toggling banner status:', error);
      return { error: 'Failed to update banner status' };
    }
  }
);
