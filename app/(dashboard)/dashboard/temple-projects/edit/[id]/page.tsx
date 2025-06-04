import EditTempleProjectClient from './edit-client';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// This is a server component that receives the params
export default async function EditTempleProjectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const searchParamsData = await searchParams;
  return (
    <Suspense fallback={<div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <EditTempleProjectClient id={id} />
    </Suspense>
  );
}

// Client component moved to edit-client.tsx
