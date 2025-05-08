'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import dynamic from 'next/dynamic';

// Dynamically import ReactFlowProvider with no SSR
const ReactFlowProvider = dynamic(
  () => import('reactflow').then((mod) => mod.ReactFlowProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ReactFlowProvider>
        {children}
      </ReactFlowProvider>
    </UserProvider>
  );
} 