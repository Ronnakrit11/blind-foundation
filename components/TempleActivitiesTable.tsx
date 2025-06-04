'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Import the server action directly
import { getTempleActivitiesList as fetchActivitiesList } from '@/app/(dashboard)/dashboard/temple-activities/actions';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export function TempleActivitiesTable() {
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadActivities() {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const result = await fetchActivitiesList();
        
        if (!isMounted) return;
        
        if (result.error) {
          setError(result.error);
        } else if (result.activitiesList) {
          setActivitiesList(result.activitiesList);
        } else {
          setActivitiesList([]);
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load activities');
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const isActivityPast = (endDateTime: string) => {
    return new Date(endDateTime) < new Date();
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-amber-50 dark:from-[#151515] dark:to-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
            ตารางกิจกรรม
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#E0E0E0] mb-2 relative inline-block">
            ตารางกิจกรรมมูลนิธิ
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-full"></span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            กิจกรรมที่กำลังดำเนินการและที่กำลังจะมาถึง
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : activitiesList.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">ยังไม่มีกิจกรรมมูลนิธิ</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-amber-100 dark:border-amber-900/30">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-amber-50 dark:bg-amber-900/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ชื่อกิจกรรม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      วันที่และเวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      สถานที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ผู้เข้าร่วม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {activitiesList.map((activity) => (
                    <tr key={activity.id} className="hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description ? activity.description.substring(0, 50) + (activity.description.length > 50 ? '...' : '') : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                          <span>
                            {format(new Date(activity.start_date_time), 'dd MMMM yyyy', { locale: th })}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                          <span>
                            {format(new Date(activity.start_date_time), 'HH:mm', { locale: th })} - 
                            {format(new Date(activity.end_date_time), 'HH:mm', { locale: th })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {activity.location ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                            <span className="truncate max-w-[150px]">{activity.location}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">ไม่ระบุ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                          {activity.current_participants || 0} 
                          {activity.max_participants ? ` / ${activity.max_participants}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isActivityPast(activity.end_date_time) ? (
                          <Badge variant="secondary">สิ้นสุดแล้ว</Badge>
                        ) : activity.is_active ? (
                          <Badge variant="success">กำลังเปิดรับสมัคร</Badge>
                        ) : (
                          <Badge variant="warning">ปิดรับสมัคร</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20"
                          asChild
                        >
                          <Link href={`/activities/${activity.id}`} prefetch={false} legacyBehavior passHref>
                            <a target="_blank" rel="noopener noreferrer">
                              <span className="flex items-center">
                                รายละเอียด
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </span>
                            </a>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
            asChild
          >
            <Link href="/activities" prefetch={false} legacyBehavior passHref>
              <a target="_blank" rel="noopener noreferrer">
                <span className="flex items-center">
                  ดูกิจกรรมทั้งหมด
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </a>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
