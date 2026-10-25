import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'سكة | القدية صارت ذكية', description: 'استكشف ألعاب Six Flags القدية، وخطّط طلعتك على جوّك مع سكة.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
