"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Wallet, Loader2, Upload, Copy, Check, CreditCard } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/auth";
import Image from "next/image";
import { useTheme } from "@/lib/theme-provider";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { getTempleProjectsList } from "@/app/(dashboard)/dashboard/temple-projects/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BankAccount {
	bank: string;
	accountNumber: string;
	accountName: string;
}

interface VerifiedSlip {
	id: number;
	amount: string;
	verifiedAt: string;
	status: "completed" | "pending";
}

// Removed DepositLimit interface as it's no longer needed

interface QrData {
	amount: number;
	qrImage: string;
	promptpayNumber: string;
	createdAt: string;
}

const BANK_NAMES: { [key: string]: string } = {
	ktb: "ธนาคารกรุงไทย",
	kbank: "ธนาคารกสิกรไทย",
	scb: "ธนาคารไทยพาณิชย์",
	gsb: "ธนาคารออมสิน",
	kkp: "ธนาคารเกียรตินาคินภัทร",
};

export default function DepositPage() {
	const { user } = useUser();
	const { theme } = useTheme();
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const pendingCheckRef = useRef(false);
	const dataFetchedRef = useRef(false);
	const [amount, setAmount] = useState("");
	const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [recentDeposits, setRecentDeposits] = useState<VerifiedSlip[]>([]);
	const [balance, setBalance] = useState(0);
	// Removed deposit limit state
	const [showLimitDialog, setShowLimitDialog] = useState(false); // Never show limit dialog
	const [copied, setCopied] = useState(false);
	// Removed today's deposits tracking
	const [selectedBank, setSelectedBank] = useState<string>("");
	const [installmentPeriod, setInstallmentPeriod] = useState<string>("");
	const [showQrModal, setShowQrModal] = useState(false);
	const [qrData, setQrData] = useState<QrData | null>(null);
	const [countdown, setCountdown] = useState<number>(0);
	const [txnId, setTxnId] = useState<string>("");
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [templeProjects, setTempleProjects] = useState<any[]>([]);
	const [selectedProject, setSelectedProject] = useState<string>("general");
	const [showAnonymousDonationDialog, setShowAnonymousDonationDialog] = useState(false);

	const bankOptions = [
		{ value: "kbank", label: "Kasikorn Bank" },
		{ value: "bbl", label: "Bangkok Bank" },
		{ value: "ktb", label: "Krung Thai Bank" },
		{ value: "scb", label: "SCB" },
		{ value: "bay", label: "Krungsri (KCC)" },
		{ value: "kfc", label: "First Choice (KFC)" },
		{ value: "all", label: "ทุกธนาคาร" }
	];

	const getInstallmentPeriods = (bank: string, amount: number) => {
		const monthlyPayment = amount ? Number(amount) : 0;
		
		switch (bank) {
			case "kbank":
			case "bbl":
			case "ktb":
				return [
					{ value: "3", label: "3 เดือน" },
					{ value: "4", label: "4 เดือน" },
					{ value: "5", label: "5 เดือน" },
					{ value: "6", label: "6 เดือน" },
					{ value: "7", label: "7 เดือน" },
					{ value: "8", label: "8 เดือน" },
					{ value: "9", label: "9 เดือน" },
					{ value: "10", label: "10 เดือน" }
				].filter(period => {
					// For BBL, check minimum monthly payment of 500 THB
					if (bank === "bbl") {
						return monthlyPayment / Number(period.value) >= 500;
					}
					return true;
				});
			case "scb":
			case "bay": // Krungsri
				return [
					{ value: "3", label: "3 เดือน" },
					{ value: "4", label: "4 เดือน" },
					{ value: "6", label: "6 เดือน" },
					{ value: "10", label: "10 เดือน" }
				];
			case "kfc": // First Choice
				return [
					{ value: "3", label: "3 เดือน" },
					{ value: "4", label: "4 เดือน" },
					{ value: "6", label: "6 เดือน" }
				];
			case "all":
			default:
				return [
					{ value: "3", label: "3 เดือน" },
					{ value: "4", label: "4 เดือน" },
					{ value: "6", label: "6 เดือน" }
				];
		}
	};

	useEffect(() => {
		// Reset installment period when bank changes
		setInstallmentPeriod("");
	}, [selectedBank]);

	useEffect(() => {
		// Reset installment period if amount changes and it's below minimum monthly payment for BBL
		if (selectedBank === "bbl" && amount) {
			const monthlyPayment = Number(amount) / Number(installmentPeriod);
			if (monthlyPayment < 500) {
				setInstallmentPeriod("");
			}
		}
	}, [amount, selectedBank, installmentPeriod]);

	const paymentMethods = [
		// {
		// 	id: "bank",
		// 	name: "Bank Transfer",
		// 	accountNumber: "162-8-11965-8",
		// 	accountName: "มูลนิธิเพื่อผู้พิการไทย",
		// },
		{
			id: "qr-promptpay",
			name: "QR PromptPay",
			description: "Scan QR code to pay",
		},
		{
			id: "card",
			name: "Credit/Debit Card",
			description: "Visa, Mastercard, JCB",
		},
		{
			id: "card-r",
			name: "Credit/Debit Card ผ่อนชำระ",
			description: "Visa, Mastercard, JCB",
		},
	];

	useEffect(() => {
		async function fetchData() {
			// Skip if we've already fetched data
			if (dataFetchedRef.current) return;
			
			try {
				// Get today's date at midnight
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const [depositsResponse, balanceResponse, projectsResult] =
					await Promise.all([
						fetch("/api/transactions/deposit"),
						fetch("/api/user/balance"),
						getTempleProjectsList()
					]);

				if (
					depositsResponse.ok &&
					balanceResponse.ok
				) {
					const [depositsData, balanceData] =
						await Promise.all([
							depositsResponse.json(),
							balanceResponse.json(),
						]);

					setRecentDeposits(depositsData);
					setBalance(Number(balanceData.balance));
				}

				if (projectsResult.projectsList) {
					setTempleProjects(projectsResult.projectsList.filter((project: any) => project.is_active));
				}
				
				// Mark data as fetched
				dataFetchedRef.current = true;
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		}

		if (user && !dataFetchedRef.current) {
			fetchData();
		}
	}, [user]);

	const handleDeposit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (selectedMethod === "bank" && (!selectedFile || !amount)) {
			toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
			return;
		}

		const amountNum = Number(amount);
		if (isNaN(amountNum) || amountNum <= 0) {
			toast.error("กรุณากรอกจำนวนเงินที่ถูกต้อง");
			return;
		}

		setIsProcessing(true);

		try {
			if (selectedMethod === "bank") {
				// Handle bank transfer
				const formData = new FormData();
				formData.append("slip", selectedFile!);
				formData.append("amount", amount);
				if (selectedProject && selectedProject !== "general") {
					formData.append("projectId", selectedProject);
				}

				const response = await fetch("/api/verify-slip", {
					method: "POST",
					body: formData,
				});

				const data = await response.json();

				if (!response.ok) {
					if (data.message === "slip_already_used") {
						toast.error("สลิปถูกใช้ไปแล้ว");
						return;
					}
					if (data.message === "deposit_limit_exceeded") {
						toast.error("เกินวงเงินการฝากรายวัน กรุณาลองใหม่ในวันพรุ่งนี้");
						return;
					}
					throw new Error(data.message || "Failed to verify slip");
				}

				if (data.status === 200) {
					toast.success("ยืนยันสลิปสำเร็จ");
					setAmount("");
					setSelectedMethod(null);
					setSelectedFile(null);

					// Refresh data
					const [recentResponse, balanceResponse] = await Promise.all([
						fetch("/api/transactions/deposit"),
						fetch("/api/user/balance"),
					]);

					if (recentResponse.ok) {
						const recentData = await recentResponse.json();
						setRecentDeposits(recentData);
					}

					if (balanceResponse.ok) {
						const balanceData = await balanceResponse.json();
						setBalance(Number(balanceData.balance));
					}
				} else {
					toast.error(data.message || "สลิปไม่ถูกต้อง");
				}
			} else if (selectedMethod === "card" || selectedMethod === "card-r") {
				// For card payments, submit the form directly to PaySolutions
				// Add project ID as a hidden field if selected
				if (selectedProject && selectedProject !== "general") {
					const hiddenField = document.createElement('input');
					hiddenField.type = 'hidden';
					hiddenField.name = 'projectId';
					hiddenField.value = selectedProject;
					
					const form = e.target as HTMLFormElement;
					form.appendChild(hiddenField);
					form.submit();
				} else {
					const form = e.target as HTMLFormElement;
					form.submit();
				}
				return;
			} else if (selectedMethod === "qr-promptpay") {
				// For card payments, submit the form directly to PaySolutions
				// Add project ID as a hidden field if selected
				const form = e.target as HTMLFormElement;
				form.submit();
				return;
				// Handle QR PromptPay
				// const response = await fetch("/api/qr-promptpay/create", {
				// 	method: "POST",
				// 	body: JSON.stringify({ 
				// 		amount,
				// 		projectId: selectedProject !== "general" ? selectedProject : undefined 
				// 	}),
				// 	headers: {
				// 		"Content-Type": "application/json",
				// 	},
				// });

				// const data = await response.json();

				// if (!response.ok) {
				// 	toast.error(data.error || "Failed to generate QR code");
				// 	return;
				// }

				// setQrData({
				// 	amount: data.data.amount,
				// 	qrImage: data.data.qrImage,
				// 	promptpayNumber: data.data.promptpayNumber,
				// 	createdAt: data.data.createdAt
				// });
				// setTxnId(data.data.txnId);
				// setShowQrModal(true);
			}
		} catch (error) {
			console.error("Error processing deposit:", error);
			toast.error("ไม่สามารถดำเนินการได้");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			if (file.size > 10 * 1024 * 1024) {
				toast.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
				return;
			}
			if (!file.type.startsWith("image/")) {
				toast.error("กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น");
				return;
			}
			setSelectedFile(file);
		}
	};

	const handleCopyAccountNumber = () => {
		navigator.clipboard.writeText("192-2-95245-7");
		setCopied(true);
		toast.success("คัดลอกเลขบัญชีแล้ว");
		setTimeout(() => setCopied(false), 2000);
	};

	// Helper function to format date
	const formatDate = (dateString: string) => {
		try {
			return new Date(dateString).toLocaleString('th-TH', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			});
		} catch (error) {
			console.error('Error formatting date:', error);
			return 'Invalid Date';
		}
	};

	const canDeposit = true; // Always allow deposits
	const showLimitError = false; // Never show limit error

	// Function to format time as MM:SS
	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	// Effect for countdown timer
	useEffect(() => {
		if (!qrData || !showQrModal) return;

		const createdTime = new Date(qrData.createdAt).getTime();
		const timeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
		const endTime = createdTime + timeLimit;

		const timer = setInterval(() => {
			const now = new Date().getTime();
			const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
			
			setCountdown(remaining);

			if (remaining <= 0) {
				clearInterval(timer);
				setShowQrModal(false);
				toast.error("QR Code หมดอายุ กรุณาทำรายการใหม่");
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [qrData, showQrModal]);

	// Function to handle redirect after successful payment
	const handlePaymentSuccess = useCallback(() => {
		router.push("/thanks-you");
	}, [router]);

	// Effect for checking payment status
	useEffect(() => {
		if (!txnId || !showQrModal) return;

		const checkPayment = async () => {
			try {
				const response = await fetch(`/api/qr-promptpay/check/${txnId}`);
				const result = await response.json();

				if (result.data.status === "SUCCESS") {
					toast.success("บริจาคสำเร็จ");
					setShowQrModal(false);
					handlePaymentSuccess();
				} else if (result.data.status === "FAIL") {
					toast.error("การบริจาคไม่สำเร็จ");
					setShowQrModal(false);
				}
			} catch (error) {
				console.error("Error checking payment status:", error);
			}
		};

		// Initial check
		checkPayment();

		// Poll every 3 seconds
		const statusInterval = setInterval(checkPayment, 3000);
		return () => clearInterval(statusInterval);
	}, [txnId, showQrModal, handlePaymentSuccess]);

	// Check for pending transactions on mount - only once
	useEffect(() => {
		// Skip if already checked or if we have a transaction in progress
		if (pendingCheckRef.current || txnId) return;
		
		// Mark as checked immediately to prevent multiple calls
		pendingCheckRef.current = true;
		
		const checkPendingTransaction = async () => {
			try {
				const response = await fetch('/api/qr-promptpay/pending');
				const result = await response.json();
				console.log('Pending transaction check:', result);

				if (result.status && result.data) {
					setQrData(result.data);
					setTxnId(result.data.txnId);
					setShowQrModal(true);
				}
			} catch (error) {
				console.error('Error checking pending transaction:', error);
			}
		};

		// Use setTimeout to ensure this runs after initial render
		const timer = setTimeout(checkPendingTransaction, 0);
		return () => clearTimeout(timer);
	}, [txnId]);

	// Function to handle cancel button click
	const handleCancelClick = () => {
		setShowCancelConfirm(true);
	};

	// Function to handle cancel confirmation
	const handleCancelConfirm = async () => {
		if (!txnId) return;

		setIsCancelling(true);
		try {
			const response = await fetch(`/api/qr-promptpay/cancel/${txnId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				toast.success('ยกเลิกรายการสำเร็จ');
				setShowQrModal(false);
			} else {
				toast.error('ไม่สามารถยกเลิกรายการได้');
			}
		} catch (error) {
			console.error('Error cancelling payment:', error);
			toast.error('เกิดข้อผิดพลาดในการยกเลิกรายการ');
		} finally {
			setIsCancelling(false);
			setShowCancelConfirm(false);
		}
	};

	// Function to handle QR payment creation
	const handleQrPayment = async (amount: string) => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/qr-promptpay/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ amount }),
			});

			const result = await response.json();
			if (response.ok) {
				setQrData(result.data);
				setTxnId(result.data.txnId);
				setShowQrModal(true);
			} else {
				toast.error(result.error || 'ไม่สามารถสร้าง QR Code ได้');
			}
		} catch (error) {
			console.error('Error creating QR payment:', error);
			toast.error('เกิดข้อผิดพลาดในการสร้าง QR Code');
		} finally {
			setIsLoading(false);
		}
	};

	// Helper function to format status
	const getStatusBadge = (status: string) => {
		const statusMap = {
			'PE': { label: 'รอการบริจาค', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
			'CP': { label: 'บริจาคสำเร็จ', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
			'CANCELLED': { label: 'ยกเลิกรายการ', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
			'FAIL': { label: 'บริจาคไม่สำเร็จ', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
		};

		const statusInfo = statusMap[status as keyof typeof statusMap] || { 
			label: status, 
			className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
		};

		return (
			<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}>
				{statusInfo.label}
			</span>
		);
	};

	const getMethodLabel = (method: string) => {
		const methodMap = {
			'QR': 'QR PromptPay',
			'BANK': 'โอนผ่านธนาคาร',
		};
		return methodMap[method as keyof typeof methodMap] || method;
	};

	return (
		<section className="flex-1 p-4 lg:p-8">
			<div className="flex justify-between items-center mb-6">
				<h1
					className={`text-lg lg:text-2xl font-medium ${
						theme === "dark" ? "text-white" : "text-gray-900"
					}`}
				>
					Donation
				</h1>
				<Button
					variant="outline"
					className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300"
					onClick={() => setShowAnonymousDonationDialog(true)}
				>
					บริจาคไม่ประสงค์ออกนาม
				</Button>
			</div>
			
			{/* Anonymous Donation Dialog */}
			<Dialog open={showAnonymousDonationDialog} onOpenChange={setShowAnonymousDonationDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>บริจาคไม่ประสงค์ออกนาม</DialogTitle>
						<DialogDescription>
							สแกน QR Code เพื่อบริจาคแบบไม่ประสงค์ออกนาม
							ธนาคารกสิกรไทย 162-8-11965-8  ออมทรัพย์ มูลนิธิเพื่อผู้พิการไทย
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center space-y-4">
						<div className="rounded-lg bg-white p-4">
							<img
								src="/qr.jpg"
								alt="Anonymous Donation QR Code"
								className="h-64 w-64"
							/>
						</div>
						<p className="text-sm text-muted-foreground text-center">
							ขอบคุณสำหรับการบริจาคของท่าน
						</p>
					</div>
				</DialogContent>
			</Dialog>

			<div className="grid gap-6 md:grid-cols-2">
				<Card
					className={
						theme === "dark" ? "bg-[#151515] border-[#2A2A2A]" : ""
					}
				>
					<CardHeader>
						<CardTitle
							className={`flex items-center space-x-2 ${
								theme === "dark" ? "text-white" : ""
							}`}
						>
							<Wallet className="h-6 w-6 text-orange-500" />
							<span>บริจาคช่วยเหลือมูลนิธิ</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							ref={formRef}
							onSubmit={(e) => {
								// Only set action and method at submission time
								if (selectedMethod === "card" || selectedMethod === "card-r" || selectedMethod === "qr-promptpay") {
									if (formRef.current) {
										formRef.current.action = "https://payments.paysolutions.asia/payment";
										formRef.current.method = "post";
									}
								}
								handleDeposit(e);
							}}
							className="space-y-6"
						>
							<div className="space-y-2">
								<Label
									htmlFor="amount"
									className={
										theme === "dark" ? "text-white" : ""
									}
								>
									Amount (THB)
								</Label>
								<Input
									id="amount"
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="Enter amount"
									required
									min={selectedMethod === "card-r" ? "3000" : "0"}
									step="0.01"
									className={`text-lg ${
										theme === "dark"
											? "bg-[#1a1a1a] border-[#2A2A2A] text-white"
											: ""
									}`}
								/>
								{selectedMethod === "card-r" && (
									<p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
										* ต้องฝากขั้นต่ำ 3,000 บาท สำหรับการผ่อนชำระ
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="project"
									className={theme === "dark" ? "text-white" : ""}
								>
									โครงการมูลนิธิ
								</Label>
								<Select
									value={selectedProject}
									onValueChange={setSelectedProject}
								>
									<SelectTrigger 
										className={`w-full ${theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""}`}
									>
										<SelectValue placeholder="เลือกโครงการที่ต้องการบริจาค (ไม่บังคับ)" />
									</SelectTrigger>
									<SelectContent className={theme === "dark" ? "bg-[#1a1a1a] border-[#2A2A2A] text-white" : ""}>
										<SelectItem value="general">บริจาคทั่วไป</SelectItem>
										{templeProjects.map((project) => (
											<SelectItem key={project.id} value={project.id.toString()}>
												{project.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
									* เลือกโครงการที่ต้องการบริจาค หรือเว้นว่างไว้สำหรับบริจาคทั่วไป
								</p>
							</div>

							<div className="space-y-2">
								<Label
									className={
										theme === "dark" ? "text-white" : ""
									}
								>
									Select Payment Method
								</Label>
								<div className="grid gap-4">
									{paymentMethods.map((method) => (
										<div
											key={method.id}
											className={`w-full p-4 rounded-md border cursor-pointer ${
												selectedMethod === method.id
													? "bg-orange-500 text-white border-orange-600"
													: theme === "dark"
													? "bg-[#1a1a1a] border-[#2A2A2A] text-white hover:bg-[#202020]"
													: "bg-white border-gray-200 hover:bg-gray-50"
											}`}
											onClick={() => setSelectedMethod(method.id)}
										>
											<div className="flex items-center space-x-4 w-full">
												{method.id === "bank" ? (
													<Image
														src="/kbank-logo.jpg"
														alt="Bank Logo"
														width={70}
														height={60}
														className="rounded-md"
													/>
												) : method.id === "qr-promptpay" ? (
													<Image
														src="/qr-promptpay.png"
														alt="QR PromptPay"
														width={70}
														height={60}
														className="rounded-md p-1"
													/>
												) : method.id === "card" || method.id === "card-r" ? (
													<div
														className="p-4 rounded-md flex items-center justify-center"
													>
														<Image
															src="/visamastercard.png"
															alt="Credit/Debit Card"
															width={70}
															height={40}
															className="rounded-md"
														/>
													</div>
												) : (
													<div
														className={`p-4 ${
															theme === "dark"
																? "bg-[#202020]"
																: "bg-gray-100"
														} rounded-md`}
													>
														<CreditCard className="h-8 w-8 text-orange-500" />
													</div>
												)}
												<div className="flex flex-col items-start flex-grow">
													<span className="font-medium">{method.name}</span>
													{method.id === "bank" ? (
														<div className="flex items-center justify-between w-full mt-1">
															{/* <div>
																<p className="text-sm opacity-75">
																	Bank: {method.accountNumber}
																</p>
																<p className="text-sm opacity-75">
																	{method.accountName}
																</p>
															</div> */}
															<Button
																type="button"
																variant="ghost"
																size="sm"
																className={`ml-2 ${
																	theme === "dark"
																		? "hover:bg-[#252525]"
																		: ""
																}`}
																onClick={(e) => {
																	e.stopPropagation();
																	handleCopyAccountNumber();
																}}
															>
																{copied ? (
																	<Check className="h-4 w-4 text-green-500" />
																) : (
																	<Copy className="h-4 w-4" />
																)}
															</Button>
														</div>
													) : (
														<p className="text-sm opacity-75">
															{method.description}
														</p>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{selectedMethod === "bank" && (
								<div className="space-y-2">
									<Label
										htmlFor="slip"
										className={
											theme === "dark" ? "text-white" : ""
										}
									>
										Upload Transfer Slip
									</Label>
									<div className="flex items-center gap-4">
										<Input
											id="slip"
											type="file"
											accept="image/*"
											onChange={handleFileChange}
											required
											className="hidden"
										/>
										<Button
											type="button"
											variant="outline"
											className={`w-full h-24 flex flex-col items-center justify-center border-dashed ${
												theme === "dark"
													? "bg-[#1a1a1a] border-[#2A2A2A] text-white hover:bg-[#202020]"
													: ""
											}`}
											onClick={() =>
												document
													.getElementById("slip")
													?.click()
											}
											disabled={Boolean(showLimitError)}
										>
											<Upload className="h-6 w-6 mb-2" />
											{selectedFile ? (
												<span className="text-sm">
													{selectedFile.name}
												</span>
											) : (
												<span className="text-sm">
													Click to upload slip
												</span>
											)}
										</Button>
									</div>
								</div>
							)}

							{selectedMethod === "card-r" && (
								<div className="space-y-4">
									<div className="space-y-2">
										<Label
											htmlFor="bank"
											className={theme === "dark" ? "text-white" : ""}
										>
											เลือกธนาคาร
										</Label>
										<select
											id="bank"
											value={selectedBank}
											onChange={(e) => setSelectedBank(e.target.value)}
											className={`w-full h-10 px-3 rounded-md border ${
												theme === "dark"
													? "bg-[#1a1a1a] border-[#2A2A2A] text-white"
													: "border-input bg-background"
											}`}
											required
										>
											<option value="">เลือกธนาคาร</option>
											{bankOptions.map((bank) => (
												<option key={bank.value} value={bank.value}>
													{bank.label}
												</option>
											))}
										</select>
									</div>

									{selectedBank && (
										<div className="space-y-2">
											<Label
												htmlFor="installment"
												className={theme === "dark" ? "text-white" : ""}
											>
												ระยะเวลาผ่อนชำระ
											</Label>
											<select
												id="installment"
												value={installmentPeriod}
												onChange={(e) => setInstallmentPeriod(e.target.value)}
												className={`w-full h-10 px-3 rounded-md border ${
													theme === "dark"
														? "bg-[#1a1a1a] border-[#2A2A2A] text-white"
														: "border-input bg-background"
												}`}
												required
											>
												<option value="">เลือกจำนวนเดือน</option>
												{getInstallmentPeriods(selectedBank, Number(amount)).map((period) => (
													<option key={period.value} value={period.value}>
														{period.label}
														{selectedBank === "bbl" && amount && (
															<> (ผ่อนเดือนละ ฿{Math.ceil(Number(amount) / Number(period.value)).toLocaleString()})</>
														)}
													</option>
												))}
											</select>
											{selectedBank === "bbl" && (
												<p className="text-sm text-gray-500">
													* ต้องผ่อนชำระไม่น้อยกว่า 500 บาท ต่องวด
												</p>
											)}
										</div>
									)}
								</div>
							)}

							{(selectedMethod === "card" || selectedMethod === "card-r") && (
								<div className="space-y-2">
									<input type="hidden" name="customeremail" value={user?.email || ""} />
									<input type="hidden" name="productdetail" value={`Deposit ${amount} THB`} />
									<input type="hidden" name="refno" value={Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')} />
									<input type="hidden" name="merchantid" value={process.env.NEXT_PUBLIC_PAYSOLUTIONS_MERCHANT_ID || ""} />
									<input type="hidden" name="cc" value="00" />
									<input type="hidden" name="total" value={amount} />
									<input type="hidden" name="lang" value="TH" />
									<input type="hidden" name="channel" value={selectedMethod === "card" ? "full" : `ibanking_${selectedBank}`} />
									{selectedMethod === "card-r" && (
										<input type="hidden" name="period" value={installmentPeriod} />
									)}
								</div>
							)}

							{selectedMethod === "qr-promptpay" && (
								<div className="space-y-2">
									<input type="hidden" name="customeremail" value={user?.email || ""} />
									<input type="hidden" name="productdetail" value={`Deposit ${amount} THB_${selectedProject}`} />
									<input type="hidden" name="refno" value={Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')} />
									<input type="hidden" name="merchantid" value={process.env.NEXT_PUBLIC_PAYSOLUTIONS_MERCHANT_ID || ""} />
									<input type="hidden" name="cc" value="00" />
									<input type="hidden" name="total" value={amount} />
									<input type="hidden" name="lang" value="TH" />
									<input type="hidden" name="channel" value="promptpay" />
								</div>
							)}

							{selectedMethod === "card-r" && Number(amount) < 3000 && (
								<p className="text-sm text-red-500 mt-2">
									กรุณาระบุจำนวนเงินอย่างน้อย 3,000 บาท สำหรับการผ่อนชำระ
								</p>
							)}

							{/* <Button
								type="submit"
								className={`w-full ${
									isProcessing
										? "bg-gray-500"
										: "bg-orange-500 hover:bg-orange-600"
								} text-white`}
								disabled={
									isProcessing ||
									Boolean(showLimitError) ||
									!selectedMethod ||
									!amount ||
									(selectedMethod === "card-r" && (!selectedBank || !installmentPeriod || Number(amount) < 3000))
								}
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Processing...
									</>
								) : (
									"Confirm Deposit"
								)}
							</Button> */}
							<Button
								// onClick={(e) => handleDeposit(e)}
								type="submit"
								disabled={isLoading}
								className={`w-full ${
									isProcessing
										? "bg-gray-500"
										: "bg-orange-500 hover:bg-orange-600"
								} text-white`}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										กำลังสร้างรายการ...
									</>
								) : (
									'บริจาค'
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card
					className={
						theme === "dark" ? "bg-[#151515] border-[#2A2A2A]" : ""
					}
				>
					<CardHeader>
						<CardTitle
							className={theme === "dark" ? "text-white" : ""}
						>
							ประวัติการบริจาค
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentDeposits.length > 0 ? (
								recentDeposits.map((deposit: any) => (
									<div
										key={deposit.id}
										className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
									>
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{getMethodLabel(deposit.method)}
												</span>
												{getStatusBadge(deposit.status)}
											</div>
											<div className="text-sm text-muted-foreground">
												{deposit.txnId}
											</div>
											<div className="text-sm text-muted-foreground">
												{formatDate(deposit.createdAt || deposit.verifiedAt)}
											</div>
										</div>
										<div className="flex flex-col items-end gap-1 mt-2 sm:mt-0">
											<div className="font-medium">
												{parseFloat(deposit.amount).toLocaleString('th-TH', {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2
												})} บาท
											</div>
										</div>
									</div>
								))
							) : (
								<p
									className={`text-center ${
										theme === "dark"
											? "text-gray-400"
											: "text-gray-500"
									}`}
								>
									ไม่พบรายการบริจาค
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
			<Dialog open={showQrModal} onOpenChange={(open) => {
        if (!open) handleCancelClick();
        setShowQrModal(open);
      }}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>สแกน QR Code เพื่อบริจาค</DialogTitle>
						<DialogDescription>
							กรุณาชำระเงินภายใน {formatTime(countdown)}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center space-y-4">
						{qrData && (
							<>
								<div className="rounded-lg bg-white p-4">
									<img
										src={`data:image/png;base64,${qrData.qrImage}`}
										alt="QR Code"
										className="h-64 w-64"
									/>
								</div>
								<div className="text-center">
									<p className="text-lg font-semibold">
										จำนวนเงิน: ฿{Number(qrData.amount).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</p>
									<p className="text-sm text-muted-foreground">
										พร้อมเพย์: {qrData.promptpayNumber}
									</p>
								</div>
								<p className="text-sm text-muted-foreground">
									กรุณารอสักครู่ ระบบกำลังตรวจสอบการชำระเงิน...
								</p>
								<Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelClick}
                >
                  ยกเลิกรายการ 
                </Button>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิกรายการ</DialogTitle>
            <DialogDescription>
              คุณต้องการยกเลิกรายการชำระเงินนี้ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              disabled={isCancelling}
            >
              ไม่ใช่
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังยกเลิกรายการ...
                </>
              ) : (
                'ใช่,ยกเลิกรายการ'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
		</section>
	);
}
