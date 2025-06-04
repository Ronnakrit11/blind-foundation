'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

interface TempleNewsDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url?: string | null;
  imageUrl?: string | null;
  created_at?: string;
  createdAt?: string;
  created_by?: string;
  createdBy?: string;
}

export default function NewsDetailPage({ params }: any) {
  const [news, setNews] = useState<TempleNewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNewsDetail() {
      try {
        setLoading(true);
        const response = await fetch(`/api/temple-news/${params.slug}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setNews(data.news);
        }
      } catch (err) {
        setError('ไม่พบข่าวที่คุณต้องการ');
        console.error('Error loading news detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNewsDetail();
  }, [params.slug]);

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

  if (error || !news) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'ไม่พบข่าวที่คุณต้องการ'}
          </h1>
          <Link 
            href="/" 
            className="inline-flex items-center text-orange-500 hover:text-orange-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปยังหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // Normalize the data to handle both camelCase and snake_case properties
  const normalizedNews = {
    ...news,
    created_at: news.createdAt || news.created_at,
    image_url: news.imageUrl || news.image_url,
    created_by: news.createdBy || news.created_by
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        href="/" 
        className="inline-flex items-center text-orange-500 hover:text-orange-600 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปยังหน้าหลัก
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {normalizedNews.title}
      </h1>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {normalizedNews.created_at && formatDistanceToNow(new Date(normalizedNews.created_at), { addSuffix: true, locale: th })}
      </div>
      
      {normalizedNews.image_url && (
        <div className="relative h-96 w-full mb-8">
          <Image
            src={normalizedNews.image_url}
            alt={normalizedNews.title}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>
      )}
      
      {normalizedNews.description && (
        <div className="text-lg text-gray-700 dark:text-gray-300 mb-8 font-medium">
          {normalizedNews.description}
        </div>
      )}
      
      <div 
        className="prose prose-orange max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: normalizedNews.content }}
      />
    </div>
  );
}
