'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/lib/auth';
import { getDonationsList, getProjects, DonationsFilter } from './actions';
import { format } from 'date-fns';
import Link from 'next/link';
import { th } from 'date-fns/locale';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Loader2, 
  X, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DonationsPage() {
  const [donationsList, setDonationsList] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  // Define payment method options
  const paymentMethods = [
    { value: 'all', label: 'ทุกวิธีการชำระเงิน' },
    { value: 'BANK', label: 'โอนผ่านธนาคาร' },
    { value: 'QR', label: 'QR PromptPay' },
    { value: 'QR_PROMPTPAY', label: 'QR PromptPay' },
    { value: 'CREDIT_CARD', label: 'บัตรเครดิต/เดบิต' }
  ];

  // Define status options
  const statusOptions = [
    { value: 'all', label: 'ทุกสถานะ' },
    { value: 'CP', label: 'สำเร็จ' },
    { value: 'PE', label: 'รอดำเนินการ' },
    { value: 'FAIL', label: 'ไม่สำเร็จ' },
    { value: 'CANCELLED', label: 'ยกเลิก' }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch projects for filter
        const projectsResult = await getProjects();
        if (projectsResult.projects) {
          setProjects(projectsResult.projects);
        }
        
        // Fetch donations with initial filters
        await fetchDonations();
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Effect to automatically apply filters when they change
  useEffect(() => {
    fetchDonations();
  }, [dateRange, statusFilter, projectFilter, methodFilter]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDonations();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      // Build filters object
      const filters: DonationsFilter = {};
      
      if (dateRange?.from) {
        filters.startDate = dateRange.from;
      }
      
      if (dateRange?.to) {
        // Add one day to include the end date fully
        const endDate = new Date(dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        filters.endDate = endDate;
      }
      
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (projectFilter && projectFilter !== 'all') {
        filters.projectId = projectFilter;
      }
      
      if (methodFilter && methodFilter !== 'all') {
        filters.method = methodFilter;
      }
      
      const result = await getDonationsList(filters);
      if (result.error) {
        setError(result.error);
      } else if (result.donationsList) {
        setDonationsList(result.donationsList);
      } else {
        setDonationsList([]);
      }
    } catch (err) {
      setError('Failed to load donations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setStatusFilter('all');
    setProjectFilter('all');
    setMethodFilter('all');
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Format data for CSV
      const headers = [
        'วันที่', 'ผู้บริจาค', 'อีเมล', 'จำนวนเงิน', 'โครงการ', 'สถานะ', 'วิธีการชำระเงิน'
      ];
      
      const csvData = donationsList.map(donation => [
        donation.paymentDate ? 
          format(new Date(donation.paymentDate), 'dd/MM/yyyy HH:mm', { locale: th }) : 
          format(new Date(donation.createdAt), 'dd/MM/yyyy HH:mm', { locale: th }),
        donation.user?.lineDisplayName || donation.user?.name || donation.customerEmail || 'ไม่ระบุ',
        donation.user?.email || donation.customerEmail || '',
        parseFloat(donation.amount || '0').toFixed(2),
        donation.project?.title || 'โครงการทั่วไป',
        donation.statusName || (donation.status === 'CP' ? 'สำเร็จ' : 
                              donation.status === 'PE' ? 'รอดำเนินการ' : 'ไม่สำเร็จ'),
        donation.method === 'BANK' ? 'โอนเงิน' : 
        donation.method === 'QR_PROMPTPAY' ? 'QR Code' : 
        donation.method
      ]);
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => 
          typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
        ).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `donations-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">รายการบริจาค</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant="outline"
            className="flex items-center justify-center sm:hidden"
          >
            <Filter className="mr-2 h-4 w-4" />
            ตัวกรอง
            {showFilters ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          <Button 
            onClick={exportToCSV} 
            disabled={isExporting || donationsList.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังส่งออก...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                ส่งออก CSV
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Date Range Picker - Always visible */}
      <div className="mb-6">
        <DateRangePicker 
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Other Filters Card - Always visible on desktop, toggleable on mobile */}
      <Card className={`mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            ตัวกรองรายการบริจาค
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาตามชื่อ หรืออีเมล"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Project Filter */}
              <div>
                <Select
                  value={projectFilter}
                  onValueChange={setProjectFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกโครงการ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกโครงการ</SelectItem>
                    <SelectItem value="null">โครงการทั่วไป</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Payment Method Filter */}
              <div>
                <Select
                  value={methodFilter}
                  onValueChange={setMethodFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวิธีการชำระเงิน" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : donationsList.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">ไม่พบรายการบริจาค</p>
          <p className="text-gray-500 dark:text-gray-400">ไม่มีรายการบริจาคที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ผู้บริจาค
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    โครงการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    วิธีการชำระเงิน
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {donationsList.map((donation) => (
                  <tr key={donation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {donation.paymentDate ? 
                        format(new Date(donation.paymentDate), 'dd MMM yyyy HH:mm', { locale: th }) : 
                        format(new Date(donation.createdAt), 'dd MMM yyyy HH:mm', { locale: th })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {donation.user?.lineDisplayName || donation.user?.name || donation.customerEmail || donation.user?.email || 'ไม่ระบุ'}
                        {donation.user?.authProvider === 'line' && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">Line</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {donation.user?.email || donation.customerEmail || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
                        parseFloat(donation.amount || '0') || 
                        parseFloat(donation.total || '0') || 
                        0
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donation.project ? (
                        <Link href={`/dashboard/projects/${donation.project.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                          {donation.project.title}
                        </Link>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">
                          โครงการทั่วไป
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.status === 'CP' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : donation.status === 'PE'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {donation.statusName || (
                          donation.status === 'CP' ? 'สำเร็จ' : 
                          donation.status === 'PE' ? 'รอดำเนินการ' : 'ไม่สำเร็จ'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {donation.method === 'BANK' ? 'โอนเงิน' : 
                       donation.method === 'QR_PROMPTPAY' ? 'QR Code' : 
                       donation.method === 'QR' ? 'QR Code' :
                       donation.method === 'CREDIT_CARD' ? 'บัตรเครดิต/เดบิต' :
                       donation.method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}