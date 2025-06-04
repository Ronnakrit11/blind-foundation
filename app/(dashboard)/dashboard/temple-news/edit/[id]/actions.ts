'use server';

import { getTempleNewsById as getNewsById, updateTempleNews as updateNews } from '@/lib/db/temple-news';

export async function getTempleNewsById(id: number) {
  return await getNewsById(id);
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
  return await updateNews({
    id,
    title,
    description,
    content,
    thumbnailUrl,
  });
}
