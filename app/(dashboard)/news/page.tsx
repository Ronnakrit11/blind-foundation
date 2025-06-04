'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { getLatestTempleNews } from './actions';

interface TempleNews {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<TempleNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        const { newsList } = await getLatestTempleNews(100); // Get all news (or a large number)
        
        // Convert the DB rows to the TempleNews type
        const typedNews = (newsList || []).map(item => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          description: item.description,
          content: item.content,
          image_url: item.thumbnail_url || item.thumbnailUrl || item.image_url || '',
          created_at: item.created_at || item.createdAt
        }));
        
        setNews(typedNews);
      } catch (error) {
        console.error('Error loading temple news:', error);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">ข่าวมูลนิธิ</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">ข่าวมูลนิธิ</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีข่าวในขณะนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">ข่าวมูลนิธิ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {news.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {item.image_url ? (
              <div className="relative h-48 w-full">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="h-48 bg-orange-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-orange-500 dark:text-gray-400 text-lg font-medium">ข่าวมูลนิธิ</span>
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-3">
                {item.description || item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(item.created_at), 'd MMMM yyyy', { locale: th })}
                </span>
                <a 
                  href={`/news/${item.slug}`} 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/news/${item.slug}`;
                  }}
                  className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                >
                  อ่านเพิ่มเติม
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
