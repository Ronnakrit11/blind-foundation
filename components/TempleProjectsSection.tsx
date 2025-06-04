'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTempleProjectsList } from '@/app/(dashboard)/dashboard/temple-projects/actions';

export function TempleProjectsSection() {
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const result = await getTempleProjectsList();
        if (result.error) {
          setError(result.error);
        } else if (result.projectsList) {
          console.log('Temple Projects Data:', result.projectsList);
          setProjectsList(result.projectsList);
        } else {
          setProjectsList([]);
        }
      } catch (err) {
        setError('Failed to load projects');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-teal-50 to-white dark:from-[#1a1a1a] dark:to-[#151515]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
            โครงการมูลนิธิ
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-[#E0E0E0] mb-2 relative inline-block">
            โครงการมูลนิธิเพื่อผู้พิการไทย
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full"></span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">โครงการต่างๆ ที่ทางมูลนิธิกำลังดำเนินการ</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 dark:border-teal-400"></div>
          </div>
        ) : projectsList.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg border border-teal-100 dark:border-teal-900/30">
            <p className="text-gray-500 dark:text-gray-400">ยังไม่มีโครงการมูลนิธิ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projectsList.map((project) => (
              <div key={project.id} className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-teal-100 dark:border-teal-900/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
                {/* Project Image */}
                {(project.thumbnailUrl || project.thumbnail_url) && (
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <Image 
                      src={project.thumbnailUrl || project.thumbnail_url} 
                      alt={project.title} 
                      width={400} 
                      height={225} 
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                
                <div className="flex items-center mb-4">
                  <span className="flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600 dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors duration-300">{project.title}</h3>
                </div>
                
                <div className="mb-6 p-4 bg-teal-50/50 dark:bg-teal-900/10 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">
                    {project.description ? 
                      (project.description.length > 120 ? 
                        `${project.description.substring(0, 120)}...` : 
                        project.description) : 
                      ''}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-teal-50 dark:bg-teal-900/20 px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">เป้าหมาย</p>
                      <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
                        {new Intl.NumberFormat('th-TH').format(project.targetAmount || project.target_amount)} บาท
                      </p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">บริจาคแล้ว</p>
                      <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        {new Intl.NumberFormat('th-TH').format(project.currentAmount || project.current_amount)} บาท
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">ความคืบหน้า</p>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{Math.round(project.progressPercentage || project.progress_percentage)}%</p>
                    </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${project.progress_percentage}%` }}
                      >
                        {project.progress_percentage > 5 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white drop-shadow-md">{Math.round(project.progress_percentage)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
               
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-12 text-center">
          <Link href="/dashboard/temple-projects">
            <Button variant="outline" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20">
              ดูโครงการทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
