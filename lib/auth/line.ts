'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { users, depositLimits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setSession } from './session';

// LINE Login API endpoints
const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';
const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify';

// Get LINE configuration from environment variables
const LINE_CLIENT_ID = process.env.LINE_CLIENT_ID || '';
const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET || '';
const LINE_REDIRECT_URI = process.env.LINE_REDIRECT_URI || '';

// Define LINE user profile interface
interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// Define LINE token response interface
interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

/**
 * Generate LINE login URL
 */
export async function getLineLoginUrl(state: string = ''): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CLIENT_ID,
    redirect_uri: LINE_REDIRECT_URI,
    state: state,
    scope: 'profile openid email',
  });

  return `${LINE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getLineToken(code: string): Promise<LineTokenResponse> {
  console.log('Getting LINE token with code:', code);
  console.log('LINE_REDIRECT_URI:', LINE_REDIRECT_URI);
  console.log('LINE_CLIENT_ID:', LINE_CLIENT_ID);
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: LINE_REDIRECT_URI,
    client_id: LINE_CLIENT_ID,
    client_secret: LINE_CLIENT_SECRET,
  });

  console.log('Token request params:', params.toString());
  
  try {
    const response = await fetch(LINE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log('Token response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE token error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(`Failed to get LINE token: ${JSON.stringify(errorData)}`);
      } catch (e) {
        throw new Error(`Failed to get LINE token: ${errorText}`);
      }
    }

    const tokenData = await response.json();
    console.log('Received LINE token successfully');
    return tokenData;
  } catch (error) {
    console.error('Error in getLineToken:', error);
    throw error;
  }
}

/**
 * Get LINE user profile using access token
 */
export async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch(LINE_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get LINE profile: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

/**
 * Verify LINE access token
 */
export async function verifyLineToken(accessToken: string): Promise<boolean> {
  const params = new URLSearchParams({
    access_token: accessToken,
  });

  const response = await fetch(`${LINE_VERIFY_URL}?${params.toString()}`);
  return response.ok;
}

/**
 * Handle LINE login callback
 * @returns Success or error object
 */
export async function handleLineCallback(code: string): Promise<{ error: string } | { success: boolean; redirectTo: string }> {
  try {
    console.log('Processing LINE login callback with code:', code);
    
    // Exchange authorization code for access token
    const tokenResponse = await getLineToken(code);
    console.log('Received LINE token response');
    
    // Get user profile from LINE
    const profile = await getLineProfile(tokenResponse.access_token);
    console.log('Received LINE profile:', profile.userId, profile.displayName);
    
    // Calculate token expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
    
    // Check if user exists with this LINE ID
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.lineId, profile.userId))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log('Updating existing user with LINE ID:', profile.userId);
      // Update existing user with new token information
      const [updatedUser] = await db
        .update(users)
        .set({
          name: profile.displayName, // Update the user's name with LINE display name
          lineAccessToken: tokenResponse.access_token,
          lineRefreshToken: tokenResponse.refresh_token,
          lineTokenExpiresAt: expiresAt,
          lineDisplayName: profile.displayName,
          linePictureUrl: profile.pictureUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.lineId, profile.userId))
        .returning();
      
      // Set user session
      if (updatedUser) {
        await setSession(updatedUser);
        console.log('User session set for existing user');
      } else {
        throw new Error('Failed to update existing user');
      }
    } else {
      console.log('Creating new user with LINE ID:', profile.userId);
      
      // Get default deposit limit (Level 1)
      let defaultLimit;
      try {
        [defaultLimit] = await db
          .select()
          .from(depositLimits)
          .where(eq(depositLimits.name, 'Level 1'))
          .limit(1);
        
        if (!defaultLimit) {
          console.log('Default deposit limit not found, creating one...');
          // Create a default deposit limit if not found
          const [createdLimit] = await db
            .insert(depositLimits)
            .values({
              name: 'Level 1',
              dailyLimit: '10000',
              monthlyLimit: '100000',
              createdBy: 1, // Assuming ID 1 is an admin or system user
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          
          defaultLimit = createdLimit;
          console.log('Created default deposit limit:', defaultLimit);
        }
      } catch (error) {
        console.error('Error handling deposit limit:', error);
        // If we can't create a deposit limit, proceed without it
        console.log('Proceeding without deposit limit');
      }
      
      // Create new user with LINE information
      const userValues: any = {
        name: profile.displayName,
        email: `${profile.userId}@line.user`, // Create a placeholder email
        lineId: profile.userId,
        lineAccessToken: tokenResponse.access_token,
        lineRefreshToken: tokenResponse.refresh_token,
        lineTokenExpiresAt: expiresAt,
        lineDisplayName: profile.displayName,
        linePictureUrl: profile.pictureUrl,
        authProvider: 'line',
        role: 'member',
      };
      
      // Add deposit limit ID if available
      if (defaultLimit && defaultLimit.id) {
        userValues.depositLimitId = defaultLimit.id;
      }
      
      console.log('Creating new user with values:', JSON.stringify(userValues));
      
      const [newUser] = await db
        .insert(users)
        .values(userValues)
        .returning();
      
      // Set user session
      if (newUser) {
        await setSession(newUser);
        console.log('User session set for new user');
      } else {
        throw new Error('Failed to create new user');
      }
    }
    
    // Session is already set in the code above (await setSession(newUser) or await setSession(existingUser))
    // No need to call setSessionCookie again
    
    // Return success information instead of redirecting directly
    return { success: true, redirectTo: '/dashboard/deposit' };
  } catch (error) {
    console.error('LINE login error:', error);
    // Return error information instead of redirecting directly
    return { error: 'line_login_failed' };
  }
}

/**
 * Refresh LINE access token
 */
export async function refreshLineToken(refreshToken: string): Promise<LineTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: LINE_CLIENT_ID,
    client_secret: LINE_CLIENT_SECRET,
  });

  const response = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to refresh LINE token: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
