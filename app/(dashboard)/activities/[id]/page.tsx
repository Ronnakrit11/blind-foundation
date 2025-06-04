import { notFound } from 'next/navigation';
import { getTempleActivityById } from '@/lib/db/temple-activities';
import ActivityDetailClient from './ActivityDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  // Await the params Promise
  const { id } = await params;
  const activityId = parseInt(id, 10) || 0;
  
  if (!activityId) {
    notFound();
  }

  const result = await getTempleActivityById(activityId);
  
  if (!result.activity) {
    notFound();
  }

  // Convert dates to proper Date objects and ensure all required fields are present
  const activity = {
    ...result.activity,
    id: result.activity.id,
    title: result.activity.title,
    description: result.activity.description,
    content: result.activity.content,
    location: result.activity.location,
    startDateTime: new Date(result.activity.startDateTime),
    endDateTime: new Date(result.activity.endDateTime),
    thumbnailUrl: result.activity.thumbnailUrl,
    maxParticipants: result.activity.maxParticipants,
    currentParticipants: result.activity.currentParticipants || 0,
    isActive: result.activity.isActive || false,
    createdBy: result.activity.createdBy,
    createdAt: new Date(result.activity.createdAt),
    updatedAt: new Date(result.activity.updatedAt)
  };

  return <ActivityDetailClient initialActivity={activity} />;
}