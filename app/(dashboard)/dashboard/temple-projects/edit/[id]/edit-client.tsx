'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getTempleProjectById, updateTempleProject } from '../../actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function EditTempleProjectClient({ id }: { id: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const projectId = parseInt(id);

  useEffect(() => {
    async function fetchProject() {
      try {
        setFetchLoading(true);
        const result = await getTempleProjectById(projectId);
        
        if (result.error) {
          setError(result.error);
        } else if (result.project) {
          const project = result.project;
          setTitle(project.title);
          setDescription(project.description || '');
          setContent(project.content);
          setThumbnailUrl(project.thumbnail_url || '');
          setTargetAmount(parseFloat(project.target_amount));
          setCurrentAmount(parseFloat(project.current_amount));
          setIsActive(project.is_active);
        } else {
          setError('ไม่พบข้อมูลโครงการ');
        }
      } catch (err) {
        setError('Failed to load project');
        console.error(err);
      } finally {
        setFetchLoading(false);
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      setError('กรุณากรอกชื่อโครงการ');
      return;
    }

    if (!content) {
      setError('กรุณากรอกรายละเอียดโครงการ');
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      setError('กรุณากรอกเป้าหมายการบริจาคที่มากกว่า 0');
      return;
    }

    try {
      setLoading(true);
      const result = await updateTempleProject({
        id: projectId,
        title,
        description,
        content,
        thumbnailUrl,
        targetAmount,
        currentAmount,
        isActive,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/temple-projects');
      }
    } catch (err) {
      setError('Failed to update project');
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
          onClick={() => router.push('/dashboard/temple-projects')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold">แก้ไขโครงการ</h1>
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
              <Label htmlFor="title">ชื่อโครงการ</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                placeholder="กรอกชื่อโครงการ"
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

            <div>
              <Label htmlFor="targetAmount">เป้าหมายการบริจาค (บาท)</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0"
                step="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="mt-1"
                placeholder="กรอกเป้าหมายการบริจาค"
              />
            </div>

            <div>
              <Label htmlFor="currentAmount">ยอดบริจาคปัจจุบัน (บาท)</Label>
              <Input
                id="currentAmount"
                type="number"
                min="0"
                step="1"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                className="mt-1"
                placeholder="กรอกยอดบริจาคปัจจุบัน"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="isActive">เปิดใช้งาน</Label>
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">รูปภาพประกอบ (ไม่บังคับ)</Label>
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
              <Label htmlFor="content">รายละเอียดโครงการ</Label>
              <div className="mt-1">
                <TiptapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="กรอกรายละเอียดโครงการ"
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
                onClick={() => router.push('/dashboard/temple-projects')}
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
