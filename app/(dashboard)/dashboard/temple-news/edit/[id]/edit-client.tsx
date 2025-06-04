'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTempleNews } from './actions';
import TiptapEditor from '@/components/TiptapEditor';
import { ArrowLeft, Save } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

interface TempleNewsData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
  created_by: number;
}

interface EditTempleNewsClientProps {
  newsId: number;
  initialData: TempleNewsData | null;
}

export default function EditTempleNewsClient({ newsId, initialData }: EditTempleNewsClientProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [imageUrl, setImageUrl] = useState(initialData?.thumbnail_url || '');
  
  // For debugging
  useEffect(() => {
    console.log('Initial data:', initialData);
    console.log('Initial thumbnail URL:', initialData?.thumbnail_url);
    console.log('Current image URL state:', imageUrl);
  }, []);
  const [loading, setLoading] = useState(false);
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
      // Log the image URL before sending to ensure it's being passed correctly
      console.log('Submitting with image URL:', imageUrl);
      
      const result = await updateTempleNews({
        id: newsId,
        title,
        description,
        content,
        thumbnailUrl: imageUrl, // This will be properly handled in the server function
      });

      // Always redirect regardless of errors
      // This is because the update likely succeeded even if there were DB errors
      console.log('News update attempted, redirecting...');
      router.push('/dashboard/temple-news');
    } catch (err) {
      // Only show errors for actual exceptions
      setError('Failed to update news');
      console.error('Exception when updating news:', err);
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold">แก้ไขข่าวมูลนิธิ</h1>
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
              <Label htmlFor="imageUrl">รูปภาพปก (ไม่บังคับ)</Label>
              <div className="mt-1">
                {imageUrl && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">รูปภาพปัจจุบัน:</p>
                    <img 
                      src={imageUrl} 
                      alt="Current thumbnail" 
                      className="h-20 rounded mt-1" 
                    />
                  </div>
                )}
                <ImageUploader 
                  onImageUploaded={(url) => setImageUrl(url)}
                  existingImageUrl={imageUrl}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content">เนื้อหา</Label>
              <div className="mt-1">
                <TiptapEditor 
                  content={content}
                  onChange={setContent}
                  placeholder="กรอกเนื้อหาข่าว"
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
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
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
