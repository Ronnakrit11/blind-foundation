'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getTempleActivityById, getActivityParticipants } from '../../actions';
import { useUser } from '@/lib/auth';
import { ArrowLeft, Download, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function ActivityParticipantsPage() {
  const [activity, setActivity] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  
  // Get the id from params using useParams hook
  const activityId = parseInt(params.id as string);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch activity details
        const activityResult = await getTempleActivityById(activityId);
        if (activityResult.error) {
          setError(activityResult.error);
          return;
        }
        
        setActivity(activityResult.activity);
        
        // Fetch participants
        const participantsResult = await getActivityParticipants(activityId);
        if (participantsResult.error) {
          setError(participantsResult.error);
          return;
        }
        
        setParticipants(participantsResult.participants || []);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (activityId) {
      fetchData();
    }
  }, [activityId]);

  const exportToCSV = () => {
    if (!participants.length || !activity) return;
    
    // Format data for CSV
    const headers = ['ชื่อ', 'อีเมล', 'เบอร์โทรศัพท์', 'สถานะ', 'วันที่ลงทะเบียน', 'หมายเหตุ'];
    
    const csvData = participants.map(p => [
      p.name || 'ไม่ระบุชื่อ',
      p.email || '',
      p.phone || '',
      p.status === 'registered' ? 'ลงทะเบียนแล้ว' : 
      p.status === 'attended' ? 'เข้าร่วมแล้ว' : 
      p.status === 'cancelled' ? 'ยกเลิก' : p.status,
      format(new Date(p.registered_at), 'dd/MM/yyyy HH:mm', { locale: th }),
      p.notes || ''
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `participants-${activity.title}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/temple-activities')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้ากิจกรรม
        </Button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          ไม่พบข้อมูลกิจกรรม
        </div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/temple-activities')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้ากิจกรรม
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/temple-activities')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold">รายชื่อผู้เข้าร่วมกิจกรรม</h1>
        </div>
        
        <Button 
          onClick={exportToCSV}
          disabled={participants.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          ส่งออก CSV
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{activity.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">วันที่</p>
              <p className="font-medium">
                {format(new Date(activity.start_date_time), 'dd MMMM yyyy', { locale: th })}
                {new Date(activity.start_date_time).toDateString() !== new Date(activity.end_date_time).toDateString() && 
                  ` - ${format(new Date(activity.end_date_time), 'dd MMMM yyyy', { locale: th })}`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">เวลา</p>
              <p className="font-medium">
                {format(new Date(activity.start_date_time), 'HH:mm', { locale: th })} - 
                {format(new Date(activity.end_date_time), 'HH:mm', { locale: th })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">สถานที่</p>
              <p className="font-medium">{activity.location || 'ไม่ระบุ'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">ผู้เข้าร่วม</p>
              <p className="font-medium">
                {activity.current_participants || 0} 
                {activity.max_participants ? ` / ${activity.max_participants}` : ''}
              </p>
            </div>
          </div>
          
          <div>
            <Badge variant={activity.is_active ? "success" : "warning"}>
              {activity.is_active ? 'กำลังเปิดรับสมัคร' : 'ปิดรับสมัคร'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium">รายชื่อผู้เข้าร่วม ({participants.length} คน)</h3>
        </div>
        
        {participants.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            ยังไม่มีผู้เข้าร่วมกิจกรรมนี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    เบอร์โทรศัพท์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    วันที่ลงทะเบียน
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {participant.name || 'ไม่ระบุชื่อ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {participant.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {participant.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        participant.status === 'registered' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : participant.status === 'attended'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {participant.status === 'registered' ? 'ลงทะเบียนแล้ว' : 
                         participant.status === 'attended' ? 'เข้าร่วมแล้ว' : 
                         participant.status === 'cancelled' ? 'ยกเลิก' : participant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(participant.registered_at), 'dd MMM yyyy HH:mm', { locale: th })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}