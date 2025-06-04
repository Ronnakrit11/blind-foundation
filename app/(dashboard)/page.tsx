"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ArrowRight, CreditCard, Database, Heart, Users, Sparkles } from 'lucide-react';
import { GoldChart } from '@/components/GoldChart';
import { SocialContacts } from '@/components/SocialContacts';
import { GoldPricesHome } from '@/components/GoldPricesHome';
import { TempleNewsSection } from '@/components/TempleNewsSection';
import { TempleProjectsSection } from '@/components/TempleProjectsSection';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/auth';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useUser();
  const [totalDonations, setTotalDonations] = useState(0);
  const [donationGoal, setDonationGoal] = useState(0);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [statsData, setStatsData] = useState({
    completedProjects: 0,
    totalDonors: 0,
    totalDonationAmount: 0,
    isLoading: true
  });
  
  // Define banner interface
  interface Banner {
    id: number;
    imageUrl: string;
    altText?: string;
    title?: string;
  }
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannersLoading, setBannersLoading] = useState(true);
  
  // Determine the donation link based on authentication status
  const donationLink = user ? '/dashboard/deposit' : '/sign-in';

  // Fetch total donations, banners, and stats
  useEffect(() => {
    async function fetchData() {
      setIsLoadingDonations(true);
      setStatsData(prev => ({ ...prev, isLoading: true }));
      try {
        // Fetch donation data for progress bar
        const donationResponse = await fetch('/api/donations/total');
        if (donationResponse.ok) {
          const data = await donationResponse.json();
          // Parse the string value to a number
          const donationAmount = parseFloat(data.total || '0');
          setTotalDonations(donationAmount);
          
          // Fetch donation goal
          const goalResponse = await fetch('/api/donations/goal');
          if (goalResponse.ok) {
            const goalData = await goalResponse.json();
            const goalAmount = parseFloat(goalData.goal || '1000000');
            setDonationGoal(goalAmount);
          } else {
            // Fallback to default goal if API fails
            setDonationGoal(1000000);
          }
          
          // Fetch stats data including total donations across all temple projects
          const statsResponse = await fetch('/api/stats');
          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            setStatsData({
              completedProjects: parseInt(stats.completedProjects || '0'),
              totalDonors: parseInt(stats.totalDonors || '0'),
              totalDonationAmount: parseFloat(stats.totalDonationAmount || '0'),
              isLoading: false
            });
          } else {
            // Fallback values if API fails
            setStatsData({
              completedProjects: 100,
              totalDonors: 1000,
              totalDonationAmount: 10000000,
              isLoading: false
            });
          }
        }
        
        // Fetch banner data
        try {
          setBannersLoading(true);
          const bannerResponse = await fetch('/api/banners');
          if (bannerResponse.ok) {
            const bannerData = await bannerResponse.json();
            if (bannerData && Array.isArray(bannerData) && bannerData.length > 0) {
              setBanners(bannerData);
            } else {
              // Set a default banner only if no banners are returned
              setBanners([{
                id: 0,
                imageUrl: '/images/foundation-banner.jpg', // Use a foundation-specific image instead of temple
                altText: 'มูลนิธิพระพุทธศาสนา',
                title: 'มูลนิธิพระพุทธศาสนา'
              }]);
            }
          }
        } catch (error) {
          console.error('Error fetching banners:', error);
          // Set a default banner on error
          setBanners([{
            id: 0,
            imageUrl: '/images/foundation-banner.jpg', // Use a foundation-specific image instead of temple
            altText: 'มูลนิธิพระพุทธศาสนา',
            title: 'มูลนิธิพระพุทธศาสนา'
          }]);
        } finally {
          setBannersLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set fallback values if API fails
        setDonationGoal(1000000);
        setStatsData({
          completedProjects: 100,
          totalDonors: 1000,
          totalDonationAmount: 10000000,
          isLoading: false
        });
      } finally {
        setIsLoadingDonations(false);
      }
    }

    fetchData();
  }, []);
  
  // Auto-slide banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex(prevIndex => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change banner every 5 seconds
    
    return () => clearInterval(interval);
  }, [banners.length]);
  
  // Current banner to display
  const currentBanner = banners[currentBannerIndex];

  return (
    <main>
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Modern background with animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 opacity-70"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern-grid.svg')] opacity-5"></div>
        
        {/* Animated background orbs */}
        <motion.div 
          className="absolute -top-20 -right-20 w-80 h-80 bg-teal-300 dark:bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-60 -left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.25, 0.2]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute -bottom-20 right-32 w-64 h-64 bg-amber-300 dark:bg-amber-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 9, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main hero content */}
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Left side content */}
            <motion.div 
              className="w-full lg:w-1/2 text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <motion.div 
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 mb-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
                  มูลนิธิยุคใหม่
                </motion.div>
                
                <motion.h1 
                  className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight sm:text-5xl md:text-6xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <span className="block">ยินดีต้อนรับสู่</span>
                  <span className="block mt-2 bg-gradient-to-r from-teal-600 via-amber-500 to-indigo-500 bg-clip-text text-transparent leading-[90px]">มูลนิธิเพื่อผู้พิการไทย</span>
                </motion.h1>
                
                <motion.p 
                  className="mt-3 text-xl text-gray-600 dark:text-gray-300 sm:mt-5 max-w-2xl mx-auto lg:mx-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  ระบบบริจาคออนไลน์เพื่อช่วยเหลือผู้ยากไร้ ไม่มีโอกาสในสังคม และสนับสนุนกิจกรรมเพื่อสังคม
                </motion.p>
                
                <motion.div 
                  className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    asChild
                    className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white rounded-full text-lg px-8 py-4 inline-flex items-center justify-center shadow-lg shadow-teal-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-1 group"
                  >
                    <Link href={donationLink} className="flex items-center">
                      <span className="relative z-10">บริจาค</span>
                      <CreditCard className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  
                  {!user ? (
                    <>
                      <Button
                        asChild
                        className="relative overflow-hidden bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-teal-200 dark:border-teal-900/30 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                      >
                        <Link href="/sign-up" className="flex items-center">
                          <span className="relative z-10">สมัคร</span>
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                      
                      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
                        <DialogTrigger asChild>
                          <Button
                            className="relative overflow-hidden bg-amber-500 hover:bg-amber-600 text-white rounded-full text-lg px-8 py-4 inline-flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 group"
                          >
                            <span className="relative z-10">บริจาคไม่ประสงค์ออกนาม</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-center text-xl font-bold">บริจาคไม่ประสงค์ออกนาม</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center justify-center p-6">
                            <Image 
                              src="/qr.jpg" 
                              alt="QR Code สำหรับบริจาค" 
                              width={250} 
                              height={250} 
                              className="mb-4"
                            />
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                              สแกน QR Code เพื่อบริจาคแบบไม่ประสงค์ออกนาม
                              ธนาคารกสิกรไทย 162-8-11965-8  ออมทรัพย์ <br />มูลนิธิเพื่อผู้พิการไทย
                            </p>
                            <DialogClose asChild>
                              <Button variant="outline">ปิด</Button>
                            </DialogClose>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="relative overflow-hidden bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-teal-200 dark:border-teal-900/30 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                    >
                      <Link href="/dashboard/merit-certificate" className="flex items-center">
                        <span className="relative z-10">โปรไฟล์</span>
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
            
            {/* Right side banner */}
            <motion.div 
              className="w-full lg:w-1/2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-500 aspect-video bg-gray-100 dark:bg-gray-800">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/30 via-amber-500/10 to-indigo-500/20 z-10"></div>
                <div className="relative w-full h-full">
                  {banners.map((banner, index) => (
                    <Image 
                      key={`banner-${index}`}
                      src={banner.imageUrl} 
                      alt={banner.altText || 'Temple Donation'} 
                      className={`object-cover transition-all duration-1000 absolute inset-0 ${index === currentBannerIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ))}
                  
                  {/* Banner navigation dots - redesigned */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                      {banners.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentBannerIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${index === currentBannerIndex ? 'bg-white scale-125' : 'bg-white/60 hover:bg-white/80'}`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Quick stats section - new addition */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {statsData.isLoading ? (
              <div className="col-span-3 flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
              </div>
            ) : (
              <>
                <motion.div 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-teal-100 dark:border-teal-900/30 text-center transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full mb-4">
                    <Database className="h-6 w-6 text-teal-600 dark:text-teal-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {statsData.completedProjects.toLocaleString('th-TH')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">โครงการที่สำเร็จ</p>
                </motion.div>
                
                <motion.div 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-teal-100 dark:border-teal-900/30 text-center transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  whileHover={{ scale: 1.03 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                    <Users className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {statsData.totalDonors.toLocaleString('th-TH')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">ผู้บริจาค</p>
                </motion.div>
                
                <motion.div 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-teal-100 dark:border-teal-900/30 text-center transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  whileHover={{ scale: 1.03 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                    <Heart className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    ฿{(statsData.totalDonationAmount).toLocaleString('th-TH')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">ยอดบริจาคทั้งหมด</p>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <TempleProjectsSection />
      
      <section className="py-20 bg-gradient-to-b from-white to-teal-50 dark:from-[#151515] dark:to-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div 
              className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 mb-4"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
              รู้จักเรา
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold text-gray-900 dark:text-[#E0E0E0] mb-2 relative inline-block"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              เกี่ยวกับมูลนิธิ
              <motion.span 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-teal-400 via-amber-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "6rem" }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5 }}
              ></motion.span>
            </motion.h2>
            <motion.p 
              className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              ข้อมูลทั่วไปเกี่ยวกับมูลนิธิและการให้บริการ
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ประวัติความเป็นมา */}
            <motion.div 
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-teal-100 dark:border-teal-900/30 group"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-400 via-amber-400 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:translate-x-1 transition-transform duration-300">ประวัติมูลนิธิเพื่อผู้พิการไทย</h3>
              </div>
              
              <div className="bg-teal-50 dark:bg-teal-900/10 p-5 rounded-lg border border-teal-100 dark:border-teal-900/30">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">"พลังแห่งความเท่าเทียม เพื่อชีวิตที่ดีกว่าของสตรีพิการไทย"</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  มูลนิธิเพื่อผู้พิการไทย ก่อตั้งขึ้นเมื่อวันที่ 25 พฤษภาคม พ.ศ. 2553 ณ ที่ตั้งเลขที่ 219/9 หมู่ 3 ตำบลบางพูด อำเภอปากเกล็ด จังหวัดนนทบุรี ด้วยความมุ่งมั่นของสองผู้นำผู้เปี่ยมวิสัยทัศน์ คือ ท่านสุทิน จันทา และท่านอรอนงค์ หอมนาน ประธานกลุ่มก้าวหน้าค้าสลาก ที่เล็งเห็นถึงความเหลื่อมล้ำทางโอกาสและคุณภาพชีวิตของ "สตรีพิการไทย" ที่ยังไม่ได้รับการพัฒนาและสนับสนุนอย่างเท่าเทียม
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  จากจุดเริ่มต้นเล็กๆ ของความตั้งใจและหัวใจแห่งการอุทิศเพื่อสังคม มูลนิธิจึงถือกำเนิดขึ้นเพื่อเป็นที่พึ่ง ที่ยืน และที่สร้างโอกาสใหม่ๆ ให้กับสตรีพิการไทย โดยมี วัตถุประสงค์หลัก 7 ประการ ดังนี้:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300 mb-3">
                  <li>เพื่อพัฒนาคุณภาพชีวิตของสตรีคนพิการไทย</li>
                  <li>เพื่อต่อสู้และเรียกร้องสิทธิและโอกาสที่เท่าเทียมของสตรีพิการไทย</li>
                  <li>เพื่อสนับสนุนการศึกษาและอาชีพของสตรีผู้พิการ</li>
                  <li>เพื่อส่งเสริมประเพณีและวัฒนธรรมอันดีงาม</li>
                  <li>เพื่อสนับสนุนให้สตรีพิการมีโอกาสประกอบอาชีพเป็นผู้แทนจำหน่ายสลากกินแบ่งรัฐบาล</li>
                  <li>เพื่อดำเนินกิจกรรมเพื่อสาธารณประโยชน์ หรือร่วมมือกับองค์กรการกุศลอื่นๆ</li>
                  <li>โดยไม่มีการเกี่ยวข้องกับการเมือง</li>
                </ul>
              </div>
            </motion.div>

            {/* คณะกรรมการ */}
            <motion.div 
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-indigo-100 dark:border-indigo-900/30 group"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-400 via-teal-400 to-amber-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:translate-x-1 transition-transform duration-300">คณะกรรมการมูลนิธิ</h3>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  คณะกรรมการชุดก่อตั้งซึ่งเป็นกำลังหลักของมูลนิธิ ประกอบด้วยบุคคลผู้เสียสละและมุ่งมั่นในการพัฒนาสังคม ดังนี้:
                </p>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นายสงกรานต์ เวียงทอง</span> — ประธานกรรมการ
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นายวีรยุทธ แก้ววิเศษ</span> — รองประธาน
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นางจันทร์ฉาย ศักดารักษ์</span> — กรรมการ
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นางสาวบุษรา ชูบุตร</span> — กรรมการ
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นางสาวจำเริญ ศักดารักษ์</span> — กรรมการ
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นายรัตนโชติ ศักดารักษ์</span> — กรรมการและเหรัญญิก
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="font-medium">นางสุพรรณี วงศาโรจน์</span> — กรรมการและเลขานุการ
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Temple News Section */}
      <TempleNewsSection />
      
      <section className="py-10 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <motion.div 
              className="relative z-10 transform transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              whileHover={{ y: -5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
                การให้ทาน คือ การสร้างบุญกุศล
              </h2>
              <div className="mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                <p className="italic">
                  "การให้ทานด้วยศรัทธา ย่อมมีผลมาก การให้ทานด้วยความเคารพ ย่อมมีผลมาก การให้ทานตามกาล ย่อมมีผลมาก การให้ทานด้วยจิตอนุเคราะห์ ย่อมมีผลมาก"
                </p>
                <p className="mt-3 text-orange-600 dark:text-orange-400 font-medium">- พระพุทธวจนะ</p>
              </div>
              <motion.div 
                className="mt-8 h-1 w-20 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "5rem" }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              ></motion.div>
            </motion.div>
            
            <motion.div 
              className="mt-12 lg:mt-0"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg transform transition-all duration-500 hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100 dark:from-orange-900/20 to-transparent rounded-bl-full opacity-50"></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="inline-block w-2 h-8 bg-orange-500 mr-3 rounded-full"></span>
                  ช่องทางการติดต่อ
                </h3>
                <div className="space-y-5 relative z-10">
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        219/6 หมู่ที่ 3 ตําบลบางพูด อําเภอปากเกร็ด<br />จังหวัดนนทบุรี 11120
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">081-226-9666</p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">info.fwd2010@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <a href="https://lin.ee/p1vT6M7" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-300">LINE Official</a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SocialContacts />
    </main>
  );
}