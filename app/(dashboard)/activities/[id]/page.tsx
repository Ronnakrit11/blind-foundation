'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTempleActivityById, registerForActivity, cancelRegistration, getUserActivities } from '@/lib/db/temple-activities';
import { useUser } from '@/lib/auth';
import { toast } from 'sonner';

export default function ActivityDetailPage({ params }: { params?: { id?: string } }) {
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  // Safely parse the ID with fallback to avoid NaN errors
  const activityId = params?.id ? parseInt(params.id, 10) || 0 : 0;

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true);
        const result = await getTempleActivityById(activityId);
        
        if (result.error) {
          setError(result.error);
        } else if (result.activity) {
          setActivity(result.activity);
          
          // Check if user is registered for this activity
          if (user) {
            const userActivitiesResult = await getUserActivities(user.id);
            if (userActivitiesResult.activities) {
              const isUserRegistered = userActivitiesResult.activities.some(
                (a: any) => a.id === activityId && a.registration_status !== 'cancelled'
              );
              setIsRegistered(isUserRegistered);
            }
          }
        } else {
          setError('ไม่พบข้อมูลกิจกรรม');
        }
      } catch (err) {
        setError('Failed to load activity');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (activityId) {
      fetchActivity();
    }
  }, [activityId, user]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    setIsRegistering(true);
    try {
      const result = await registerForActivity(activityId, user.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsRegistered(true);
        toast.success('ลงทะเบียนเข้าร่วมกิจกรรมสำเร็จ');
        
        // Refresh activity data to get updated participant count
        const updatedActivity = await getTempleActivityById(activityId);
        if (updatedActivity.activity) {
          setActivity(updatedActivity.activity);
        }
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลงทะเบียน');
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!user) return;
    
    setIsCancelling(true);
    try {
      const result = await cancelRegistration(activityId, user.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsRegistered(false);
        toast.success('ยกเลิกการลงทะเบียนสำเร็จ');
        
        // Refresh activity data to get updated participant count
        const updatedActivity = await getTempleActivityById(activityId);
        if (updatedActivity.activity) {
          setActivity(updatedActivity.activity);
        }
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการยกเลิกการลงทะเบียน');
      console.error(error);
    } finally {
      setIsCancelling(false);
    }
  };

  const isActivityFull = activity?.max_participants && activity.current_participants >= activity.max_participants;
  const isActivityPast = activity && new Date(activity.end_date_time) < new Date();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
          <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'ไม่พบข้อมูลกิจกรรม'}
          </h1>
          <Link 
            href="/activities" 
            className="inline-flex items-center text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปยังหน้ากิจกรรมทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        href="/activities" 
        className="inline-flex items-center text-orange-500 hover:text-orange-600 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปยังหน้ากิจกรรมทั้งหมด
      </Link>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {activity.thumbnail_url ? (
          <div className="relative h-72 w-full">
            <Image
              src={activity.thumbnail_url}
              alt={activity.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              priority
            />
          </div>
        ) : (
          <div className="h-48 bg-orange-100 dark:bg-gray-700 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-orange-500 dark:text-gray-400" />
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {activity.title}
          </h1>
          
          {activity.description && (
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              {activity.description}
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">วันที่</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {format(new Date(activity.start_date_time), 'dd MMMM yyyy', { locale: th })}
                    {new Date(activity.start_date_time).toDateString() !== new Date(activity.end_date_time).toDateString() && 
                      ` - ${format(new Date(activity.end_date_time), 'dd MMMM yyyy', { locale: th })}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">เวลา</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {format(new Date(activity.start_date_time), 'HH:mm', { locale: th })} - 
                    {format(new Date(activity.end_date_time), 'HH:mm', { locale: th })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {activity.location && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">สถานที่</h3>
                    <p className="text-gray-600 dark:text-gray-400">{activity.location}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <Users className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">ผู้เข้าร่วม</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activity.current_participants || 0} 
                    {activity.max_participants ? ` / ${activity.max_participants}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className="prose prose-orange max-w-none dark:prose-invert mb-8"
            dangerouslySetInnerHTML={{ __html: activity.content }}
          />
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {isActivityPast ? (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-300">กิจกรรมนี้สิ้นสุดไปแล้ว</p>
              </div>
            ) : !activity.is_active ? (
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg text-center">
                <p className="text-yellow-800 dark:text-yellow-300">ปิดรับสมัครแล้ว</p>
              </div>
            ) : isRegistered ? (
              <div className="space-y-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-green-800 dark:text-green-300">คุณได้ลงทะเบียนเข้าร่วมกิจกรรมนี้แล้ว</p>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleCancelRegistration}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิกการลงทะเบียน'}
                </Button>
              </div>
            ) : isActivityFull ? (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-center">
                <p className="text-red-800 dark:text-red-300">กิจกรรมเต็มแล้ว</p>
              </div>
            ) : (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเข้าร่วมกิจกรรม'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}