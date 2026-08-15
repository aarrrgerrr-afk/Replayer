import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FortNite Replay Viewer — Watch Every Match',
  description: 'Upload and watch Fortnite replays in a fully interactive 3D viewer with player tracking, kill feeds, and storm visualization.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-fn-darker text-fn-white font-body antialiased">
        {children}
      </body>
    </html>
  );
}
