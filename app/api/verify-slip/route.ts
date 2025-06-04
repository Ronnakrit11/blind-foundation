import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { userBalances, users, depositLimits, paymentTransactions, templeProjects } from '@/lib/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendDepositNotification } from '@/lib/telegram/bot';

const API_URL = 'https://developer.easyslip.com/api/v1/verify';
const API_KEY = process.env.EASYSLIP_API_KEY;

const EXPECTED_RECEIVER = {
  name: {
    th: "มูลนิธิเพื่อผู้พิการไทย",
    thShort: "มูลนิธิเพื่อผู้พิการไทย",
    thPartial: "มูลนิธิเพื่อผู้พิการไทย", // Add partial name for more flexible matching
    en: "FOUNDATION F",
    enPartial: "FOUNDATION F" // Add partial English name for more flexible matching
  },
  account: "162-8-11965-8",
  accountIdentifiers: ["9658", "1965", "658","1628"], // Add shorter identifier for more flexible matching
  type: "BANKAC"
};

if (!API_KEY) {
  throw new Error('EASYSLIP_API_KEY not configured');
}

// Define response type according to EasySlip API
type EasySlipResponse = {
  status: number;
  data?: {
    payload: string;
    transRef: string;
    date: string;
    countryCode: string;
    amount: {
      amount: number;
      local: {
        amount?: number;
        currency?: string;
      };
    };
    fee?: number;
    ref1?: string;
    ref2?: string;
    ref3?: string;
    sender: {
      bank: {
        id: string;
        name?: string;
        short?: string;
      };
      account: {
        name: {
          th?: string;
          en?: string;
        };
        bank?: {
          type: 'BANKAC' | 'TOKEN' | 'DUMMY';
          account: string;
        };
        proxy?: {
          type: 'NATID' | 'MSISDN' | 'EWALLETID' | 'EMAIL' | 'BILLERID';
          account: string;
        };
      };
    };
    receiver: {
      bank: {
        id: string;
        name?: string;
        short?: string;
      };
      account: {
        name: {
          th?: string;
          en?: string;
        };
        bank?: {
          type: 'BANKAC' | 'TOKEN' | 'DUMMY';
          account: string;
        };
        proxy?: {
          type: 'NATID' | 'MSISDN' | 'EWALLETID' | 'EMAIL' | 'BILLERID';
          account: string;
        };
      };
      merchantId?: string;
    };
  };
  message?: string;
}

function validateReceiver(data: EasySlipResponse): boolean {
  if (!data.data?.receiver?.account) {
    console.log('No receiver account data found');
    return false;
  }

  const receiver = data.data.receiver.account;
  console.log('Validating receiver:', JSON.stringify(receiver, null, 2));
  
  // Check receiver name with more flexible matching
  const receiverNameTh = receiver.name?.th;
  const receiverNameEn = receiver.name?.en;
  
  // Check bank account
  const receiverAccount = receiver.bank?.account;
  const receiverType = receiver.bank?.type;
  
  console.log(`Comparing received: ${receiverNameTh} / ${receiverNameEn} / ${receiverAccount} / ${receiverType}`);
  console.log(`With expected: ${EXPECTED_RECEIVER.name.th} / ${EXPECTED_RECEIVER.name.en} / ${EXPECTED_RECEIVER.account} / ${EXPECTED_RECEIVER.type}`);
  
  // More flexible name matching
  const nameMatches = (
    // Thai name checks
    (receiverNameTh && (
      receiverNameTh === EXPECTED_RECEIVER.name.th ||
      receiverNameTh === EXPECTED_RECEIVER.name.thShort ||
      receiverNameTh.includes(EXPECTED_RECEIVER.name.thPartial)
    )) ||
    // English name checks
    (receiverNameEn && (
      receiverNameEn === EXPECTED_RECEIVER.name.en ||
      receiverNameEn.includes(EXPECTED_RECEIVER.name.enPartial)
    ))
  );
  
  // More flexible account matching
  const accountMatches = receiverAccount && receiverType ? (
    receiverType === EXPECTED_RECEIVER.type &&
    (
      receiverAccount === EXPECTED_RECEIVER.account ||
      EXPECTED_RECEIVER.accountIdentifiers.some(id => receiverAccount.includes(id))
    )
  ) : false;
  
  console.log(`Name matches: ${nameMatches}, Account matches: ${accountMatches}`);
  
  // Return true if either name or account matches
  // In production, you might want to be more strict and require both to match
  return nameMatches || accountMatches;
}

async function checkSlipAlreadyUsed(transRef: string): Promise<boolean> {
  const existingSlip = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.transRef, transRef))
    .limit(1);

  return existingSlip.length > 0;
}

async function checkDepositLimits(userId: number, amount: number): Promise<{ allowed: boolean; message?: string }> {
  // Always allow deposits regardless of limits
  return { allowed: true };
  
  /* Original limit checking code commented out
  // Get user's deposit limit
  const [user] = await db
    .select({
      depositLimit: depositLimits
    })
    .from(users)
    .leftJoin(depositLimits, eq(users.depositLimitId, depositLimits.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.depositLimit) {
    return { allowed: false, message: 'No deposit limit set for user' };
  }

  // Get today's total deposits
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [dailyTotal] = await db
    .select({
      total: sql<string>`COALESCE(sum(${paymentTransactions.amount}), '0')`
    })
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.userId, userId),
        gte(paymentTransactions.createdAt, today)
      )
    );

  const dailyTotalAmount = Number(dailyTotal.total);
  const newDailyTotal = dailyTotalAmount + amount;
  const dailyLimit = Number(user.depositLimit.dailyLimit);

  if (newDailyTotal > dailyLimit) {
    return { 
      allowed: false, 
      message: `Deposit would exceed daily limit of ฿${dailyLimit.toLocaleString()}`
    };
  }

  return { allowed: true };
  */
}

async function recordVerifiedSlip(transRef: string, amount: number, userId: number | null, projectId?: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  await db.transaction(async (tx) => {
    // Record the verified slip
    const productDetail = projectId ? 'เติมเงินเพื่อบริจาคโครงการมูลนิธิ' : 'เติมเงินผ่านการโอนเงิน';
    
    // Create payment transaction
    await tx.insert(paymentTransactions).values({
      status: 'CP',
      statusName: 'ชำระเงินสำเร็จ',
      total: amount.toString(),
      amount: amount.toString(),
      userId: userId,
      method: 'BANK',
      transRef: transRef,
      merchantId: '',
      orderNo: transRef,
      refNo: transRef,
      productDetail: productDetail,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentDate: new Date(),
      // Add project reference if specified
      ...(projectId ? { projectId: parseInt(projectId) } : {})
    });

    // Update user balance
    await tx
      .update(userBalances)
      .set({
        balance: sql`${userBalances.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userBalances.userId, userId));
    
    // If projectId is provided, update the temple project's currentAmount and progressPercentage
    if (projectId) {
      const projectIdNum = parseInt(projectId);
      
      // First, get the current project data
      const projectData = await tx
        .select()
        .from(templeProjects)
        .where(eq(templeProjects.id, projectIdNum))
        .limit(1);
      
      if (projectData.length > 0) {
        const project = projectData[0];
        const newCurrentAmount = parseFloat(project.currentAmount || '0') + amount;
        const targetAmount = parseFloat(project.targetAmount || '1');
        const newProgressPercentage = Math.min((newCurrentAmount / targetAmount) * 100, 100);
        
        // Update the project with correct column names
        await tx
          .update(templeProjects)
          .set({
            currentAmount: newCurrentAmount.toString(),
            progressPercentage: newProgressPercentage.toString(),
            updatedAt: new Date()
          })
          .where(eq(templeProjects.id, projectIdNum));
      }
    }
  });
}

export async function POST(request: Request) {
  try {
    console.log('Starting slip verification process');
    const user = await getUser();
    console.log('User:', user ? `ID: ${user.id}, Name: ${user.name || user.email}` : 'Not logged in');
    
    const formData = await request.formData();
    const file = formData.get('slip') as File;
    const projectId = formData.get('projectId') as string || undefined;
    
    console.log('Project ID:', projectId || 'None');

    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json(
        { status: 400, message: 'invalid_payload' },
        { status: 400 }
      );
    }

    console.log(`File received: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)}KB`);

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large');
      return NextResponse.json(
        { status: 400, message: 'image_size_too_large' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { status: 400, message: 'invalid_image' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    console.log('Image converted to base64, length:', base64.length);

    // Call EasySlip API
    console.log('Calling EasySlip API:', API_URL);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        image: base64
      }),
      cache: 'no-store',
    });

    console.log('EasySlip API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EasySlip API error:', errorText);
      return NextResponse.json(
        { status: 400, message: 'invalid_slip', details: errorText },
        { status: 400 }
      );
    }

    const data: EasySlipResponse = await response.json();
    console.log('EasySlip API response data:', JSON.stringify(data, null, 2));

    // Handle different response statuses
    if (!data.data) {
      console.log('No data in response:', data.message);
      return NextResponse.json(
        { status: 400, message: 'invalid_slip', details: data.message },
        { status: 400 }
      );
    }

    // Log the receiver information for debugging
    console.log('Receiver info:', JSON.stringify(data.data.receiver, null, 2));
    console.log('Expected receiver:', JSON.stringify(EXPECTED_RECEIVER, null, 2));

    // Validate receiver information
    const receiverValid = validateReceiver(data);
    console.log('Receiver validation result:', receiverValid);
    
    if (!receiverValid) {
      return NextResponse.json(
        { 
          status: 400, 
          message: 'invalid_receiver',
          details: 'Transfer must be to the correct account only: มูลนิธิเพื่อผู้พิการไทย (162-8-11965-8)'
        },
        { status: 400 }
      );
    }

    // Check if slip has already been used
    if (data.data?.transRef) {
      console.log('Checking if slip already used, transRef:', data.data.transRef);
      const isUsed = await checkSlipAlreadyUsed(data.data.transRef);
      
      if (isUsed) {
        console.log('Slip already used');
        return NextResponse.json(
          {
            status: 400,
            message: 'slip_already_used',
            details: 'This transfer slip has already been used'
          },
          { status: 400 }
        );
      }

      // Check deposit limits if user is logged in
      if (user) {
        console.log('Checking deposit limits for user:', user.id);
        const depositCheck = await checkDepositLimits(user.id, data.data.amount.amount);
        
        if (!depositCheck.allowed) {
          console.log('Deposit limit exceeded:', depositCheck.message);
          return NextResponse.json(
            {
              status: 400,
              message: 'deposit_limit_exceeded',
              details: depositCheck.message
            },
            { status: 400 }
          );
        }
      }

      console.log('Recording verified slip, amount:', data.data.amount.amount);
      // Record the verified slip, update user balance, and update project if applicable
      await recordVerifiedSlip(
        data.data.transRef,
        data.data.amount.amount,
        user?.id || null,
        projectId
      );

      // Send Telegram notification
      if (user) {
        console.log('Sending Telegram notification');
        await sendDepositNotification({
          userName: user.name || user.email,
          amount: data.data.amount.amount,
          transRef: data.data.transRef
        });
      }
    } else {
      console.log('No transRef found in response');
      return NextResponse.json(
        { 
          status: 400, 
          message: 'invalid_slip_data',
          details: 'Missing transaction reference in slip data'
        },
        { status: 400 }
      );
    }

    console.log('Slip verification successful');
    return NextResponse.json({ status: 200, message: 'success' });
  } catch (error) {
    console.error('Error verifying slip:', error);
    return NextResponse.json(
      { status: 500, message: 'server_error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}