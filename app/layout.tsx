import type { Metadata } from 'next';
import './globals.css';
import {SikkaFeedback} from '@/components/sikka/feedback';
export const metadata: Metadata = { title: 'سكة | القدية صارت ذكية', description: 'استكشف ألعاب Six Flags القدية، وخطّط طلعتك على جوّك مع سكة.', manifest: '/manifest.webmanifest', icons: { icon: [{url:'/brand/sikka-tab-transparent-32.png',sizes:'32x32',type:'image/png'},{url:'/brand/sikka-tab-transparent-64.png',sizes:'64x64',type:'image/png'}], shortcut: '/favicon.ico', apple: [{url:'/brand/sikka-icon-180.png',sizes:'180x180',type:'image/png'}] }, appleWebApp: {capable:true,title:'سكة',statusBarStyle:'default'} };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="ar" dir="rtl"><body>{children}<SikkaFeedback/></body></html>; }
