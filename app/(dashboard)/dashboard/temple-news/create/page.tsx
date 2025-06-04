'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTempleNews } from '../actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function CreateTempleNewsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      setError('กรุณากรอกชื่อข่าว');
      return;
    }

    if (!content) {
      setError('กรุณากรอกเนื้อหาข่าว');
      return;
    }

    try {
      setLoading(true);
      const result = await createTempleNews({
        title,
        description,
        content,
        thumbnailUrl,
        userId: user?.id as number,
        customSlug: customSlug || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/temple-news');
      }
    } catch (err) {
      setError('Failed to create news');
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
          onClick={() => router.push('/dashboard/temple-news')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold">เพิ่มข่าวมูลนิธิใหม่</h1>
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
              <Label htmlFor="title">ชื่อข่าว</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                placeholder="กรอกชื่อข่าว"
              />
            </div>
            <div>
              <Label htmlFor="customSlug">URL Slug (ถ้าไม่กรอก จะสร้างอัตโนมัติจากชื่อข่าว)</Label>
              <Input
                id="customSlug"
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="my-custom-news-slug"
                className="mt-1"
              />
              {customSlug && (
                <p className="text-sm text-gray-500 mt-1">
                  URL จะเป็น: /news/{customSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')}
                </p>
              )}
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
              <Label htmlFor="thumbnailUrl">รูปภาพปก (ไม่บังคับ)</Label>
              <div className="mt-1">
                <ImageUploader 
                  onImageUploaded={(url) => setThumbnailUrl(url)}
                  existingImageUrl={thumbnailUrl}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">เนื้อหา</Label>
              <div className="mt-1">
                <TiptapEditor 
                  content={content} 
                  onChange={setContent}
                  placeholder="เริ่มพิมพ์เนื้อหาข่าวมูลนิธิที่นี่..."
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
