import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db/drizzle';
import { users, depositLimits, paymentTransactions } from '@/lib/db/schema';
import { CustomerList } from './customer-list';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { desc, isNull, eq, sql, sum } from 'drizzle-orm';
import { ShieldAlert, Users, CreditCard, ArrowUpCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

export default async function CustomersPage() {
  const currentUser = await getUser();
  
  if (!currentUser) {
    redirect('/sign-in');
  }

  if (currentUser.role !== 'admin') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold dark:text-white text-gray-900 mb-2">Access Denied</h2>
            <p className="text-center max-w-md dark:text-gray-400 text-gray-500">
              Only administrators have access to the customer list. Please contact an administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Get all users except deleted ones and admins
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      depositLimitId: users.depositLimitId,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));
    
  // Count regular members (excluding admins and owners)
  const regularMembers = allUsers.filter(user => user.role !== 'admin' && user.role !== 'owner');

  // Get all deposit limits for the dropdown
  const depositLimitsList = await db
    .select()
    .from(depositLimits)
    .orderBy(depositLimits.name);
    
  // Get donation summary statistics
  const [totalDonations] = await db
    .select({
      count: sql<number>`count(*)`,
      totalAmount: sql<string>`sum(COALESCE(${paymentTransactions.amount}, ${paymentTransactions.total}))`,
    })
    .from(paymentTransactions)
    .where(eq(paymentTransactions.status, 'CP'));
    
  // Get top donors
  const topDonors = await db
    .select({
      userId: paymentTransactions.userId,
      userName: users.name,
      userEmail: users.email,
      lineDisplayName: users.lineDisplayName,
      authProvider: users.authProvider,
      customerEmail: paymentTransactions.customerEmail,
      totalAmount: sql<string>`sum(COALESCE(${paymentTransactions.amount}, ${paymentTransactions.total}))`,
      count: sql<number>`count(*)`
    })
    .from(paymentTransactions)
    .leftJoin(users, eq(paymentTransactions.userId, users.id))
    .where(eq(paymentTransactions.status, 'CP'))
    .groupBy(paymentTransactions.userId, users.name, users.email, users.lineDisplayName, users.authProvider, paymentTransactions.customerEmail)
    .orderBy(desc(sql`sum(${paymentTransactions.amount})`))
    .limit(5);
    
  // Get monthly donation statistics for current year
  const currentYear = new Date().getFullYear();
  const monthlyStats = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${paymentTransactions.createdAt})`,
      totalAmount: sql<string>`sum(${paymentTransactions.amount})`
    })
    .from(paymentTransactions)
    .where(
      sql`EXTRACT(YEAR FROM ${paymentTransactions.createdAt}) = ${currentYear} AND ${paymentTransactions.status} = 'CP'`
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${paymentTransactions.createdAt})`)
    .orderBy(sql`EXTRACT(MONTH FROM ${paymentTransactions.createdAt})`);

  // Format the monthly data for display
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const formattedMonthlyStats = monthlyStats.map(stat => ({
    month: monthNames[Number(stat.month) - 1],
    amount: parseFloat(stat.totalAmount)
  }));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium dark:text-white text-gray-900 mb-6">
        สมาชิกทั้งหมดของวัด
      </h1>
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">จำนวนสมาชิกทั้งหมด</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{regularMembers.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">จำนวนรายการบริจาคทั้งหมด</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalDonations?.count || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <ArrowUpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ยอดบริจาครวมทั้งหมด</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ฿{parseFloat(totalDonations?.totalAmount || '0').toLocaleString('th-TH', {maximumFractionDigits: 2})}                  
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="dark:bg-[#151515] dark:border-[#2A2A2A] mb-6">
        <CardHeader>
          <CardTitle className="dark:text-white">สมาชิกทั้งหมดของวัด</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerList users={allUsers} depositLimits={depositLimitsList} />
        </CardContent>
      </Card>
      
      <h2 className="text-lg lg:text-xl font-medium dark:text-white text-gray-900 mb-4">
        สรุปยอดบริจาคสมาชิก
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Donors */}
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="dark:text-white">ผู้บริจาคสูงสุด 5 อันดับ</CardTitle>
          </CardHeader>
          <CardContent>
            {topDonors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ชื่อ</th>
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">อีเมล</th>
                      <th className="py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">จำนวนครั้ง</th>
                      <th className="py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDonors.map((donor, index) => (
                      <tr key={donor.userId || index} className={index !== topDonors.length - 1 ? "border-b dark:border-gray-700" : ""}>
                        <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                          {donor.lineDisplayName || donor.userName || donor.customerEmail || 'ไม่ระบุชื่อ'}
                          {donor.authProvider === 'line' && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">Line</span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{donor.userEmail || donor.customerEmail || '-'}</td>
                        <td className="py-4 text-sm text-gray-900 dark:text-gray-100 text-right">{donor.count}</td>
                        <td className="py-4 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                          ฿{parseFloat(donor.totalAmount).toLocaleString('th-TH', {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">ไม่พบข้อมูลการบริจาค</p>
            )}
          </CardContent>
        </Card>
        
        {/* Monthly Statistics */}
        <Card className="dark:bg-[#151515] dark:border-[#2A2A2A]">
          <CardHeader>
            <CardTitle className="dark:text-white">สถิติการบริจาครายเดือน (ปี {currentYear + 543})</CardTitle>
          </CardHeader>
          <CardContent>
            {formattedMonthlyStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">เดือน</th>
                      <th className="py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ยอดบริจาค</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedMonthlyStats.map((stat, index) => (
                      <tr key={index} className={index !== formattedMonthlyStats.length - 1 ? "border-b dark:border-gray-700" : ""}>
                        <td className="py-4 text-sm text-gray-900 dark:text-gray-100">{stat.month}</td>
                        <td className="py-4 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                          ฿{stat.amount.toLocaleString('th-TH', {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">ไม่พบข้อมูลการบริจาคในปีนี้</p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}