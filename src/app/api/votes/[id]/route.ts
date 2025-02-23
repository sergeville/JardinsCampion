import { NextRequest } from 'next/server';

// Configure route for static export
export const dynamic = 'error';
export const dynamicParams = false;

// Since this is a dynamic route, we need to specify which paths will be generated
export function generateStaticParams() {
  return [];
}

export async function DELETE(request: NextRequest) {
  return new Response(
    'This API route is not available in static export. Please use client-side data management.',
    { status: 404 }
  );
}
