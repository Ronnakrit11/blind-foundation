'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Activity, Menu, UserCircle, Coins, Wallet, BarChart2, FileText, Globe, LogOut, ClipboardList, History, Key, CreditCard, BanknoteIcon, Moon, Sun, Package, PiggyBank, ShoppingBag, Newspaper, User, Image as ImageIcon } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { SocialContacts } from '@/components/SocialContacts';
import { useTheme } from '@/lib/theme-provider';
import { signOut } from '@/app/(login)/actions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const lineLoginNotificationShown = useRef(false);
  const [generalNavItems, setGeneralNavItems] = useState<Array<{
    href: string;
    icon: any;
    label: string;
  }>>([]);
  const [adminNavItems, setAdminNavItems] = useState<Array<{
    href: string;
    icon: any;
    label: string;
  }>>([]);

  const isDark = theme === 'dark';

  // Check for LINE login success parameter and show notification only once
  useEffect(() => {
    const lineLoginSuccess = searchParams.get('lineLoginSuccess');
    console.log('LINE login success parameter:', lineLoginSuccess);
    console.log('Current user:', user);
    
    if (lineLoginSuccess === 'true' && !lineLoginNotificationShown.current && user) {
      console.log('Showing LINE login success notification');
      lineLoginNotificationShown.current = true;
      
      toast.success('เข้าสู่ระบบสำเร็จ', {
        description: 'ยินดีต้อนรับกลับมา' + (user?.lineDisplayName ? ` คุณ${user.lineDisplayName}` : ''),
        duration: 5000,
      });
      
      // Remove the parameter from URL to prevent showing the notification again on refresh
      const params = new URLSearchParams(window.location.search);
      params.delete('lineLoginSuccess');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, user]);

  useEffect(() => {
    const isAdmin = user?.role === 'admin';
    
    const baseItems = [

      

      { href: '/dashboard/deposit', icon: Wallet, label: 'บริจาค' },
      { href: '/dashboard/merit-certificate', icon: FileText, label: 'ใบอนุโมทนาบุญ' },


      { href: '/dashboard/security', icon: Shield, label: 'เปลี่ยนรหัสผ่าน' },
      { href: '/dashboard/2fa', icon: Key, label: 'ตั้งค่า 2FA' },
      { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    ];

    const adminItems = [



      { href: '/dashboard/management/banners', icon: ImageIcon, label: 'จัดการแบนเนอร์' },
      { href: '/dashboard/temple-news', icon: Newspaper, label: 'ข่าวมูลนิธิ' }, 
      { href: '/dashboard/temple-projects', icon: Coins, label: 'โครงการมูลนิธิ' },
      { href: '/dashboard/donations', icon: BanknoteIcon, label: 'รายการบริจาค' }, 


      { href: '/dashboard/customers', icon: UserCircle, label: 'สมาชิกทั้งหมด' },




      { href: '/dashboard/website-settings', icon: Globe, label: 'จัดการเว็บไซต์' },
      { href: '/dashboard/admin', icon: Shield, label: 'จัดการเเอดมิน' },
    ];

    setGeneralNavItems(isAdmin ? [] : baseItems);
    setAdminNavItems(isAdmin ? adminItems : []);
  }, [user]);

  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={`flex flex-col min-h-screen w-full ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#F8FAFC]'}`}>
      {/* Top Navigation */}
      <header className={`lg:pl-72 fixed w-full z-50 ${isDark ? 'bg-[#111111]/80 border-[#222222]' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-sm`}>
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`lg:hidden ${isDark ? 'text-white' : 'text-gray-700'}`}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={isDark ? 'text-white' : 'text-gray-700'}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              {user?.linePictureUrl ? (
                <Image 
                  src={user.linePictureUrl} 
                  alt="Profile" 
                  width={32} 
                  height={32} 
                  className="rounded-full"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <User className="h-4 w-4" />
                </div>
              )}
              <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {user?.name || user?.lineDisplayName || user?.email}
              </div>
            </div>

            <form action={signOut}>
              <Button 
                type="submit"
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDark ? 'bg-[#111111] border-[#222222]' : 'bg-white border-gray-200'} border-r flex flex-col`}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6 py-4 ${isDark ? 'border-[#222222]' : 'border-gray-200'}">
          <Image
            src="/Ar-logo2.png"
            alt="Logo"
            width={170}
            height={170}
            className="h-12 w-auto"
          />
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {/* General Menu Items */}
          {generalNavItems.length > 0 && (
            <div className="space-y-1">
              <h2 className={`px-2 py-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                General
              </h2>
              {generalNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      pathname === item.href
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : isDark
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } transition-colors`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}

          {/* Admin Menu Items */}
          {adminNavItems.length > 0 && (
            <div className="space-y-1 mt-6">
              <h2 className={`px-2 py-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                Admin
              </h2>
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${
                      pathname === item.href
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : isDark
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } transition-colors`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 lg:pl-72 pt-16`}>
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
     
    </div>
  );
}