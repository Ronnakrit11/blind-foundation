'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithLine } from '@/app/(login)/actions';
import Image from 'next/image';

export function LineLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithLine();
      
      // If we get a redirect URL, navigate to it
      if (result?.redirectUrl) {
        console.log('Redirecting to:', result.redirectUrl);
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      console.error('Error during LINE login:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#06C755]/90 text-white border-none"
      onClick={handleLineLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-pulse">Loading...</span>
      ) : (
        <>
          <Image
            src="/line.png"
            alt="LINE"
            width={84}
            height={84}
            className="mr-3"
          />
          Sign in with LINE
        </>
      )}
    </Button>
  );
}
