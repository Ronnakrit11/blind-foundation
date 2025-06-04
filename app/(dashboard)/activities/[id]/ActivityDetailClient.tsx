'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/auth';
import { toast } from 'sonner';
import { TempleActivity } from '@/lib/db/schema';

interface ActivityDetailClientProps {
  initialActivity: {
    id: number;
    title: string;
    description: string | null;
    content: string;
    location: string | null;
    startDateTime: Date;
    endDateTime: Date;
    thumbnailUrl: string | null;
    maxParticipants: number | null;
    currentParticipants: number;
    isActive: boolean;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

export default function ActivityDetailClient({ initialActivity }: ActivityDetailClientProps) {
  const [activity] = useState<TempleActivity>(initialActivity);
  const router = useRouter();
  const { user } = useUser();

  // Rest of your client-side component logic here
  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        ย้อนกลับ
      </Button>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {activity.thumbnailUrl && (
          <div className="relative w-full h-64 mb-6">
            <Image
              src={activity.thumbnailUrl}
              alt={activity.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4">{activity.title}</h1>

        <div className="grid gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="mr-2 h-5 w-5" />
            <span>
              {format(new Date(activity.startDateTime), 'EEEE d MMMM yyyy', { locale: th })}
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="mr-2 h-5 w-5" />
            <span>
              {format(new Date(activity.startDateTime), 'HH:mm')} น.
            </span>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin className="mr-2 h-5 w-5" />
            <span>{activity.location}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Users className="mr-2 h-5 w-5" />
            <span>{activity.maxParticipants || 0} คน</span>
          </div>
        </div>

        <div className="prose max-w-none mb-6">
          <h2 className="text-xl font-semibold mb-2">รายละเอียดกิจกรรม</h2>
          <p>{activity.description}</p>
        </div>
      </div>
    </div>
  );
}
