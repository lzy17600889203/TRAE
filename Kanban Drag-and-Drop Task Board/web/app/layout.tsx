import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kanban Drag & Drop Task Board',
  description: 'Next.js + Fastify + SQLite 经典看板任务管理系统'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
