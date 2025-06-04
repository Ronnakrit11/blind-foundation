'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { getTempleActivitiesList, deleteTempleActivity } from './actions';
import { useUser } from '@/lib/auth';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function TempleActivitiesPage() {
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const result = await getTempleActivitiesList();
        if (result.error) {
          setError(result.error);
        } else if (result.activitiesList) {
          setActivitiesList(result.activitiesList);
        } else {
          setActivitiesList([]);
        }
      } catch (err) {
        setError('Failed to load activities');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const openDeleteDialog = (id: number) => {
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (activityToDelete === null) return;
    
    try {
      const result = await deleteTempleActivity(activityToDelete);
      if (result.error) {
        setError(result.error);
      } else {
        setActivitiesList(activitiesList.filter(activity => activity.id !== activityToDelete));
      }
    } catch (err) {
      setError('Failed to delete activity');
      console.error(err);
    } finally {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  const isActivityPast = (endDateTime: string) => {
    return new Date(endDateTime) < new Date();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการกิจกรรมมูลนิธิ</h1>
        <Button onClick={() => router.push('/dashboard/temple-activities/create')}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างกิจกรรมใหม่
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : activitiesList.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีกิจกรรมมูลนิธิ</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/dashboard/temple-activities/create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            สร้างกิจกรรมใหม่
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
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
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {activitiesList.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.description ? activity.description.substring(0, 50) + (activity.description.length > 50 ? '...' : '') : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(activity.start_date_time), 'dd MMM yyyy', { locale: th })}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(activity.start_date_time), 'HH:mm', { locale: th })} - 
                      {format(new Date(activity.end_date_time), 'HH:mm', { locale: th })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {activity.location || 'ไม่ระบุ'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {activity.current_participants || 0} 
                    {activity.max_participants ? ` / ${activity.max_participants}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isActivityPast(activity.end_date_time) ? (
                      <Badge variant="secondary">สิ้นสุดแล้ว</Badge>
                    ) : activity.is_active ? (
                      <Badge variant="success">กำลังเปิดรับสมัคร</Badge>
                    ) : (
                      <Badge variant="warning">ปิดรับสมัคร</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/temple-activities/participants/${activity.id}`)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/temple-activities/edit/${activity.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => openDeleteDialog(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบกิจกรรม</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบกิจกรรมนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ และจะลบข้อมูลผู้เข้าร่วมทั้งหมดด้วย
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              ลบกิจกรรม
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}