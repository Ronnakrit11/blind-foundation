'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTempleActivity } from '../actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save, Calendar, Clock, MapPin, Users } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { format } from 'date-fns';

export default function CreateTempleActivityPage() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();

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

      const result = await createTempleActivity({
        title,
        description,
        content,
        location,
        startDateTime,
        endDateTime,
        thumbnailUrl,
        maxParticipants,
        userId: user?.id as number,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/temple-activities');
      }
    } catch (err) {
      setError('Failed to create activity');
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
        <h1 className="text-2xl font-bold">สร้างกิจกรรมใหม่</h1>
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
                  min={format(new Date(), 'yyyy-MM-dd')}
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
                  min={startDate || format(new Date(), 'yyyy-MM-dd')}
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

            <div>
              <Label htmlFor="thumbnailUrl">รูปภาพปก (ไม่บังคับ)</Label>
              <div className="mt-1">
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
                  placeholder="เริ่มพิมพ์รายละเอียดกิจกรรมที่นี่..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                บันทึก
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}