'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getLatestTempleNews } from '@/app/(dashboard)/news/actions';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface TempleNews {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
}

export function TempleNewsSection() {
  const [news, setNews] = useState<TempleNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        const { newsList } = await getLatestTempleNews(3);
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
            ข่าวสารล่าสุด
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#E0E0E0] mb-2 relative inline-block">
            ข่าวมูลนิธิเพื่อผู้พิการไทย
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full"></span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 dark:border-teal-900/30 overflow-hidden animate-pulse">
              <div className="h-48 bg-teal-100/50 dark:bg-teal-900/20"></div>
              <div className="p-6">
                <div className="h-6 bg-teal-100/50 dark:bg-teal-900/20 rounded-full w-3/4 mb-4"></div>
                <div className="h-4 bg-teal-100/50 dark:bg-teal-900/20 rounded-full w-full mb-2"></div>
                <div className="h-4 bg-teal-100/50 dark:bg-teal-900/20 rounded-full w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return null; // Don't show the section if there's no news
  }

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-50 to-white dark:from-[#151515] dark:to-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            ข่าวสารล่าสุด
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#E0E0E0] mb-2 relative inline-block">
            ข่าวมูลนิธิเพื่อผู้พิการไทย
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-indigo-400 to-teal-500 rounded-full"></span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">ติดตามข่าวสารและกิจกรรมล่าสุดของมูลนิธิที่นี่</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item) => (
            <div key={item.id} className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/30 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              {item.image_url ? (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-teal-100 dark:from-indigo-900/30 dark:to-teal-900/30 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 text-lg font-medium">ข่าวมูลนิธิ</span>
                </div>
              )}
              <div className="p-6">
                <div className="mb-2 text-xs text-indigo-600 dark:text-indigo-300 font-medium">
                  {format(new Date(item.created_at), 'd MMMM yyyy', { locale: th })}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-3">
                  {item.description || item.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                </p>
                <a 
                  href={`/news/${item.slug}`} 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/news/${item.slug}`;
                  }}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm transition-colors duration-300"
                >
                  อ่านเพิ่มเติม
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a 
            href="/news" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/news';
            }}
            className="inline-flex items-center px-6 py-3 border border-indigo-200 dark:border-indigo-800 text-sm font-medium rounded-xl shadow-sm text-indigo-700 dark:text-indigo-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ดูข่าวทั้งหมด
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
