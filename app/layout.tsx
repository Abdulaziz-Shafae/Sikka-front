import type { Metadata } from 'next';
import './globals.css';
import {SikkaFeedback} from '@/components/sikka/feedback';
export const metadata: Metadata = { title: 'سكة | القدية صارت ذكية', description: 'استكشف ألعاب Six Flags القدية، وخطّط طلعتك على جوّك مع سكة.', manifest: '/manifest.webmanifest', icons: { icon: [{url:'/brand/sikka-footer-light.png',type:'image/png'}], shortcut: '/brand/sikka-footer-light.png', apple: [{url:'/brand/sikka-icon-180.png',sizes:'180x180',type:'image/png'}] }, appleWebApp: {capable:true,title:'سكة',statusBarStyle:'default'} };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="ar" dir="rtl"><body>{children}<SikkaFeedback/></body></html>; }
