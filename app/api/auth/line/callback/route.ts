import { NextRequest, NextResponse } from 'next/server';
import { handleLineCallback } from '@/lib/auth/line';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If there's an error in the LINE callback
  if (error) {
    console.error('LINE login error:', error, errorDescription);
    return NextResponse.redirect(new URL('/sign-in?error=line_login_failed', request.url));
  }

  // If no code is provided
  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=invalid_request', request.url));
  }

  try {
    // Process the LINE login callback
    const result = await handleLineCallback(code);
    
    // Check if there was an error
    if ('error' in result) {
      console.log('LINE login returned error:', result.error);
      return NextResponse.redirect(new URL(`/sign-in?error=${result.error}`, request.url));
    }
    
    // Handle successful login
    if ('success' in result && result.success && result.redirectTo) {
      console.log('LINE login successful, redirecting to:', result.redirectTo);
      // Add a success parameter to the redirect URL
      const redirectUrl = new URL(result.redirectTo, request.url);
      redirectUrl.searchParams.set('lineLoginSuccess', 'true');
      return NextResponse.redirect(redirectUrl);
    }
    
    // Fallback redirect if something unexpected happens
    const fallbackUrl = new URL('/dashboard/deposit', request.url);
    fallbackUrl.searchParams.set('lineLoginSuccess', 'true');
    return NextResponse.redirect(fallbackUrl);
  } catch (error) {
    console.error('Error processing LINE login:', error);
    return NextResponse.redirect(new URL('/sign-in?error=line_login_failed', request.url));
  }
}
