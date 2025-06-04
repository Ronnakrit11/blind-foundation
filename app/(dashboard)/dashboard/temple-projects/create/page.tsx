'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTempleProject } from '../actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function CreateTempleProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();

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
      const result = await createTempleProject({
        title,
        description,
        content,
        thumbnailUrl,
        targetAmount,
        userId: user?.id as number,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/temple-projects');
      }
    } catch (err) {
      setError('Failed to create project');
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
          onClick={() => router.push('/dashboard/temple-projects')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold">สร้างโครงการใหม่</h1>
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
              <Label htmlFor="thumbnailUrl">รูปภาพปก (ไม่บังคับ)</Label>
              <div className="mt-1">
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
                  placeholder="เริ่มพิมพ์รายละเอียดโครงการที่นี่..."
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
