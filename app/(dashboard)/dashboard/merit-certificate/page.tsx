"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme-provider";
import { useRouter } from "next/navigation";
import { Download, FileText, Printer, Search } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Transaction {
  id: number;
  amount: string;
  createdAt: string;
  status: string;
  donorName?: string;
}

export default function MeritCertificatePage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [certificateType, setCertificateType] = useState("personal");
  const [customName, setCustomName] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch user's donation transactions
  useEffect(() => {
    async function fetchTransactions() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const response = await fetch("/api/transactions/deposit");
        if (response.ok) {
          const data = await response.json();
          // Filter only completed transactions
          const completedTransactions = data.filter(
            (tx: Transaction) => tx.status === "CP"
          );
          setTransactions(completedTransactions);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("ไม่สามารถดึงข้อมูลรายการบริจาคได้");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [user]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(tx => {
    const searchLower = searchTerm.toLowerCase();
    const amountStr = parseFloat(tx.amount).toLocaleString('th-TH');
    const dateStr = format(new Date(tx.createdAt), 'dd MMMM yyyy', { locale: th });
    
    return (
      amountStr.includes(searchTerm) ||
      dateStr.toLowerCase().includes(searchLower) ||
      (tx.donorName && tx.donorName.toLowerCase().includes(searchLower))
    );
  });

  // Handle certificate generation
  const generateCertificate = () => {
    if (certificateType === "personal" && !selectedTransaction) {
      toast.error("กรุณาเลือกรายการบริจาค");
      return;
    }

    if (certificateType === "custom") {
      if (!customName || !customDate || !customAmount) {
        toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }
    }

    setShowPreview(true);
  };

  // Handle print certificate
  const printCertificate = () => {
    window.print();
  };

  // Handle download certificate as PDF
  const downloadCertificate = () => {
    toast.info("กำลังดาวน์โหลดใบอนุโมทนาบุญ");
    
    // Import dynamically to avoid SSR issues
    import('html2canvas').then((html2canvasModule) => {
      const html2canvas = html2canvasModule.default;
      import('jspdf').then((jsPDFModule) => {
        const jsPDF = jsPDFModule.default;
        
        // Get the certificate element
        const certificateElement = document.querySelector('.w-full.max-w-4xl.bg-white') as HTMLElement;
        
        if (!certificateElement) {
          toast.error("ไม่พบเอกสารใบอนุโมทนาบุญ");
          return;
        }
        
        // Create a clone of the element to ensure proper rendering
        const clone = certificateElement.cloneNode(true) as HTMLElement;
        clone.style.width = '1000px';
        clone.style.padding = '40px';
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.left = '-9999px';
        document.body.appendChild(clone);
        
        html2canvas(clone, {
          scale: 2, // Higher scale for better quality
          useCORS: true, // Allow loading cross-origin images
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        }).then((canvas) => {
          // Remove the clone from the DOM
          document.body.removeChild(clone);
          
          // Calculate dimensions to maintain aspect ratio
          const imgWidth = 210; // A4 width in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Create PDF
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          
          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // Generate filename
          const donorName = certificateType === "personal" 
            ? (selectedTransaction?.donorName || user?.name || "donor") 
            : customName || "donor";
          const sanitizedName = donorName.replace(/[^\w\s]/gi, '').trim();
          const filename = `ใบอนุโมทนาบุญ_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Save PDF
          pdf.save(filename);
          toast.success("ดาวน์โหลดใบอนุโมทนาบุญเรียบร้อยแล้ว");
        }).catch((error) => {
          console.error('Error generating PDF:', error);
          toast.error("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF");
        });
      }).catch((error) => {
        console.error('Error loading jsPDF:', error);
        toast.error("เกิดข้อผิดพลาดในการโหลดไลบรารี่ PDF");
      });
    }).catch((error) => {
      console.error('Error loading html2canvas:', error);
      toast.error("เกิดข้อผิดพลาดในการโหลดไลบรารี่สร้างภาพ");
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className={`text-lg lg:text-2xl font-medium mb-6 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}>
        ใบอนุโมทนาบุญ
      </h1>

      {!showPreview ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className={theme === "dark" ? "bg-[#151515] border-[#2A2A2A]" : ""}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 ${
                theme === "dark" ? "text-white" : ""
              }`}>
                <FileText className="h-6 w-6 text-orange-500" />
                <span>สร้างใบอนุโมทนาบุญ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className={theme === "dark" ? "text-white" : ""}>
                    ประเภทใบอนุโมทนาบุญ
                  </Label>
                  <Select
                    value={certificateType}
                    onValueChange={setCertificateType}
                  >
                    <SelectTrigger className={`w-full ${
                      theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""
                    }`}>
                      <SelectValue placeholder="เลือกประเภทใบอนุโมทนาบุญ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">ใบอนุโมทนาบุญจากรายการบริจาค</SelectItem>
                      
                    </SelectContent>
                  </Select>
                </div>

                {certificateType === "personal" ? (
                  <>
                    <div className="space-y-2">
                      <Label className={theme === "dark" ? "text-white" : ""}>
                        ค้นหารายการบริจาค
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="ค้นหาตามจำนวนเงิน หรือวันที่"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`pl-10 ${
                            theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={theme === "dark" ? "text-white" : ""}>
                        รายการบริจาค
                      </Label>
                      <div className={`border rounded-md overflow-hidden ${
                        theme === "dark" ? "border-[#2A2A2A]" : "border-gray-200"
                      }`}>
                        <div className="max-h-60 overflow-y-auto">
                          {isLoading ? (
                            <div className="p-4 text-center">
                              <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
                                กำลังโหลดข้อมูล...
                              </p>
                            </div>
                          ) : filteredTransactions.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className={theme === "dark" ? "bg-[#1a1a1a]" : "bg-gray-50"}>
                                <tr>
                                  <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${
                                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                                  } uppercase tracking-wider`}>
                                    วันที่
                                  </th>
                                  <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${
                                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                                  } uppercase tracking-wider`}>
                                    จำนวนเงิน
                                  </th>
                                  <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${
                                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                                  } uppercase tracking-wider`}>
                                    ชื่อผู้บริจาค
                                  </th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                                theme === "dark" ? "bg-[#151515]" : "bg-white"
                              }`}>
                                {filteredTransactions.map((tx) => (
                                  <tr 
                                    key={tx.id}
                                    onClick={() => setSelectedTransaction(tx)}
                                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202020] ${
                                      selectedTransaction?.id === tx.id 
                                        ? "bg-orange-50 dark:bg-orange-900/20" 
                                        : ""
                                    }`}
                                  >
                                    <td className={`px-4 py-3 text-sm ${
                                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                                    }`}>
                                      {format(new Date(tx.createdAt), 'dd MMMM yyyy', { locale: th })}
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-medium ${
                                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                                    }`}>
                                      ฿{parseFloat(tx.amount).toLocaleString('th-TH')}
                                    </td>
                                    <td className={`px-4 py-3 text-sm ${
                                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                                    }`}>
                                      {tx.donorName || user?.name || "ไม่ระบุชื่อ"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-4 text-center">
                              <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
                                ไม่พบรายการบริจาค
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className={theme === "dark" ? "text-white" : ""}>
                        ชื่อผู้บริจาค
                      </Label>
                      <Input
                        placeholder="ระบุชื่อผู้บริจาค"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className={theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={theme === "dark" ? "text-white" : ""}>
                        วันที่บริจาค
                      </Label>
                      <Input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className={theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={theme === "dark" ? "text-white" : ""}>
                        จำนวนเงิน (บาท)
                      </Label>
                      <Input
                        type="number"
                        placeholder="ระบุจำนวนเงิน"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className={theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={generateCertificate}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  สร้างใบอนุโมทนาบุญ
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={theme === "dark" ? "bg-[#151515] border-[#2A2A2A]" : ""}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 ${
                theme === "dark" ? "text-white" : ""
              }`}>
                <FileText className="h-6 w-6 text-orange-500" />
                <span>คำแนะนำการใช้งาน</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`space-y-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                <p>
                  ใบอนุโมทนาบุญเป็นเอกสารที่แสดงการบริจาคเงินเพื่อทำนุบำรุงวัด สามารถใช้เป็นหลักฐานในการลดหย่อนภาษีได้
                </p>
                <div className="space-y-2">
                  <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    วิธีการสร้างใบอนุโมทนาบุญ
                  </h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>เลือกประเภทใบอนุโมทนาบุญที่ต้องการ</li>
                    <li>กรณีเลือกจากรายการบริจาค ให้เลือกรายการที่ต้องการจากตาราง</li>
                    <li>กรณีสร้างแบบกำหนดเอง ให้กรอกข้อมูลให้ครบถ้วน</li>
                    <li>กดปุ่ม "สร้างใบอนุโมทนาบุญ" เพื่อดูตัวอย่าง</li>
                    <li>สามารถพิมพ์หรือดาวน์โหลดเป็นไฟล์ PDF ได้</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    หมายเหตุ
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ใบอนุโมทนาบุญจะมีผลทางกฎหมายเมื่อมีลายเซ็นของเจ้าอาวาสเท่านั้น</li>
                    <li>กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนพิมพ์</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Certificate Preview */}
          <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg shadow-lg p-8 mb-6 print:shadow-none print:border-none">
            <div className="flex justify-center mb-6">
              <img 
                src="/Ar-logo2.png" 
                alt="Temple Logo" 
                className="h-24 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/200x200?text=วัด";
                }}
              />
            </div>
            
            <h1 className="text-center text-3xl font-bold text-orange-600 mb-2">ใบอนุโมทนาบุญ</h1>
            <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">มูลนิธิเพื่อผู้พิการไทย</h2>
            
            <div className="text-center mb-8">
              <p className="text-lg text-gray-700">
                ขออนุโมทนาบุญกับ
              </p>
              <p className="text-xl font-semibold text-gray-900 mt-2">
                {certificateType === "personal" 
                  ? (selectedTransaction?.donorName || user?.name || "ท่านผู้มีจิตศรัทธา") 
                  : customName}
              </p>
              <p className="text-lg text-gray-700 mt-4">
                ที่ได้บริจาคทรัพย์จำนวน
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {certificateType === "personal"
                  ? `${parseFloat(selectedTransaction?.amount || "0").toLocaleString('th-TH')} บาท`
                  : `${parseFloat(customAmount || "0").toLocaleString('th-TH')} บาท`
                }
              </p>
              <p className="text-lg text-gray-700 mt-4">
                เพื่อช่วยเหลือผู้พิการ
              </p>
              <p className="text-lg text-gray-700 mt-2">
                เมื่อวันที่ {certificateType === "personal"
                  ? format(new Date(selectedTransaction?.createdAt || new Date()), 'dd MMMM yyyy', { locale: th })
                  : format(new Date(customDate || new Date()), 'dd MMMM yyyy', { locale: th })
                }
              </p>
            </div>
            
            <div className="flex justify-between items-center mt-16">
            
           
              
             
            </div>
            
            <div className="text-center text-gray-500 text-sm mt-12">
              <p>มูลนิธิเพื่อผู้พิการไทย</p>
              <p>219/6 หมู่ที่ 3 ตําบลบางพูด อําเภอปากเกร็ด
จังหวัดนนทบุรี

</p>
              <p>โทร. 081-226-9666</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-4 print:hidden">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className={theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""}
            >
              กลับไปแก้ไข
            </Button>
            <Button
              onClick={printCertificate}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์ใบอนุโมทนาบุญ
            </Button>
            <Button
              onClick={downloadCertificate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด PDF
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
