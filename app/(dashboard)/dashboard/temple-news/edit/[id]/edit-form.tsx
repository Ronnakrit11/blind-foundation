'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTempleNews } from './actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save } from 'lucide-react';

interface TempleNewsData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  created_by: number;
}

interface EditNewsFormProps {
  newsId: number;
  initialData: TempleNewsData | null;
}

export default function EditNewsForm({ newsId, initialData }: EditNewsFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [saving, setSaving] = useState(false);
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
      setSaving(true);
      const result = await updateTempleNews({
        id: newsId,
        title,
        description,
        content,
        thumbnailUrl: imageUrl, // Pass imageUrl as thumbnailUrl parameter
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success || result.news) {
        // If we have a success flag or news object, consider it successful
        router.push('/dashboard/temple-news');
      } else {
        // Handle unexpected response format
        console.warn('Unexpected response format:', result);
        router.push('/dashboard/temple-news');
      }
    } catch (err) {
      setError('Failed to update news');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/temple-news')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
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
              <Label htmlFor="imageUrl">URL รูปภาพปก (ไม่บังคับ)</Label>
              <Input
                id="imageUrl"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1"
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <div className="mt-2">
                  <img 
                    src={imageUrl} 
                    alt="Thumbnail preview" 
                    className="max-h-40 rounded-md"
                    onError={() => setError('Invalid image URL')}
                  />
                </div>
              )}
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
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
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
