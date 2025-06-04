'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUpcomingTempleActivities } from '@/lib/db/temple-activities';
import { useUser } from '@/lib/auth';

interface TempleActivity {
  id: number;
  title: string;
  description: string | null;
  content: string;
  location: string | null;
  start_date_time: string;
  end_date_time: string;
  thumbnail_url: string | null;
  max_participants: number | null;
  current_participants: number;
  is_active: boolean;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<TempleActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        const { activitiesList, error } = await getUpcomingTempleActivities(100);
        
        if (error) {
          console.error('Error loading activities:', error);
          setActivities([]);
        } else {
          // Transform the raw database rows to match the TempleActivity interface
          const transformedActivities = activitiesList ? activitiesList.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            content: row.content,
            location: row.location,
            start_date_time: row.start_date_time,
            end_date_time: row.end_date_time,
            thumbnail_url: row.thumbnail_url,
            max_participants: row.max_participants,
            current_participants: row.current_participants || 0,
            is_active: row.is_active
          })) : [];
          
          setActivities(transformedActivities);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">กิจกรรมมูลนิธิ</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">กิจกรรมมูลนิธิ</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ไม่มีกิจกรรมที่กำลังจะมาถึงในขณะนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">กิจกรรมมูลนิธิ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {activity.thumbnail_url ? (
              <div className="relative h-48 w-full">
                <Image
                  src={activity.thumbnail_url}
                  alt={activity.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="h-48 bg-orange-100 dark:bg-gray-700 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-orange-500 dark:text-gray-400" />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {activity.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {activity.description || activity.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    {format(new Date(activity.start_date_time), 'dd MMMM yyyy', { locale: th })}
                    {new Date(activity.start_date_time).toDateString() !== new Date(activity.end_date_time).toDateString() && 
                      ` - ${format(new Date(activity.end_date_time), 'dd MMMM yyyy', { locale: th })}`
                    }
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    {format(new Date(activity.start_date_time), 'HH:mm', { locale: th })} - 
                    {format(new Date(activity.end_date_time), 'HH:mm', { locale: th })}
                  </span>
                </div>
                {activity.location && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{activity.location}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    ผู้เข้าร่วม: {activity.current_participants || 0} 
                    {activity.max_participants ? ` / ${activity.max_participants}` : ''}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className={`text-sm font-medium ${
                  activity.max_participants && activity.current_participants >= activity.max_participants
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {activity.max_participants && activity.current_participants >= activity.max_participants
                    ? 'เต็มแล้ว'
                    : 'เปิดรับสมัคร'}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                  className="text-orange-500 border-orange-500 hover:bg-orange-50 hover:text-orange-600"
                >
                  <Link href={`/activities/${activity.id}`}>
                    รายละเอียด
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}