'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getTempleActivityById, updateTempleActivity } from '../../actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save, Calendar, Clock, MapPin, Users } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { format } from 'date-fns';

export default function EditTempleActivityClient({ id }: { id: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const activityId = parseInt(id);

  useEffect(() => {
    async function fetchActivity() {
      try {
        setFetchLoading(true);
        const result = await getTempleActivityById(activityId);
        
        if (result.error) {
          setError(result.error);
        } else if (result.activity) {
          const activity = result.activity;
          setTitle(activity.title);
          setDescription(activity.description || '');
          setContent(activity.content);
          setLocation(activity.location || '');
          
          // Format dates and times
          const startDateTime = new Date(activity.start_date_time);
          const endDateTime = new Date(activity.end_date_time);
          
          setStartDate(format(startDateTime, 'yyyy-MM-dd'));
          setStartTime(format(startDateTime, 'HH:mm'));
          setEndDate(format(endDateTime, 'yyyy-MM-dd'));
          setEndTime(format(endDateTime, 'HH:mm'));
          
          setThumbnailUrl(activity.thumbnail_url || '');
          setMaxParticipants(activity.max_participants);
          setIsActive(activity.is_active);
        } else {
          setError('ไม่พบข้อมูลกิจกรรม');
        }
      } catch (err) {
        setError('Failed to load activity');
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    }

    if (activityId) {
      fetchActivity();
    }
  }, [activityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      setError('กรุณากรอกชื่อกิจกรรม');
      return;
    }

    if (!content) {
      setError('กรุณากรอกรายละเอียดกิจกรรม');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setError('กรุณากรอกวันที่และเวลาให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);
      
      // Combine date and time strings into Date objects
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      // Validate dates
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setError('รูปแบบวันที่หรือเวลาไม่ถูกต้อง');
        setLoading(false);
        return;
      }
      
      if (startDateTime >= endDateTime) {
        setError('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
        setLoading(false);
        return;
      }

      const result = await updateTempleActivity({
        id: activityId,
        title,
        description,
        content,
        location,
        startDateTime,
        endDateTime,
        thumbnailUrl,
        maxParticipants,
        isActive,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/temple-activities');
      }
    } catch (err) {
      setError('Failed to update activity');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/temple-activities')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold">แก้ไขกิจกรรม</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">ชื่อกิจกรรม</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                placeholder="กรอกชื่อกิจกรรม"
              />
            </div>

            <div>
              <Label htmlFor="description">คำอธิบายสั้นๆ (ไม่บังคับ)</Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                placeholder="กรอกคำอธิบายสั้นๆ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  วันที่เริ่มต้น
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  เวลาเริ่มต้น
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  วันที่สิ้นสุด
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  min={startDate}
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  เวลาสิ้นสุด
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                สถานที่จัดกิจกรรม
              </Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1"
                placeholder="กรอกสถานที่จัดกิจกรรม"
              />
            </div>

            <div>
              <Label htmlFor="maxParticipants" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                จำนวนผู้เข้าร่วมสูงสุด (ไม่ระบุหากไม่จำกัด)
              </Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={maxParticipants || ''}
                onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : undefined)}
                className="mt-1"
                placeholder="กรอกจำนวนผู้เข้าร่วมสูงสุด"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="isActive">เปิดรับสมัคร</Label>
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">รูปภาพปก (ไม่บังคับ)</Label>
              <div className="mt-1">
                {thumbnailUrl && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">รูปภาพปัจจุบัน:</p>
                    <img 
                      src={thumbnailUrl} 
                      alt="Current thumbnail" 
                      className="h-20 rounded mt-1" 
                    />
                  </div>
                )}
                <ImageUploader
                  onImageUploaded={(url) => setThumbnailUrl(url)}
                  existingImageUrl={thumbnailUrl}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">รายละเอียดกิจกรรม</Label>
              <div className="mt-1">
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="กรอกรายละเอียดกิจกรรม"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    บันทึก
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/temple-activities')}
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}