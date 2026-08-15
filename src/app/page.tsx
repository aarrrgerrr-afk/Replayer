'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import UploadZone from '@/components/UploadZone';
import { useReplayStore } from '@/lib/replay-store';
import { parseReplayFile, generateDemoData } from '@/lib/replay-parser';

const ReplayViewer = dynamic(() => import('@/components/ReplayViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-fn-darker">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-4 border-fn-purple/30 border-t-fn-purple spin-slow mx-auto mb-4" />
        <p className="text-fn-purple font-medium">Loading Viewer...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const { isLoaded, isLoading, loadError, setReplayData, setLoading, setError } = useReplayStore();

  const handleFileSelected = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (file.name === 'Demo_Replay.replay' && file.size === 4) {
        // Demo mode
        await new Promise((r) => setTimeout(r, 500)); // Brief delay for UX
        data = generateDemoData();
      } else {
        // Parse actual replay file
        data = await parseReplayFile(file);
      }
      setReplayData(data);
    } catch (err) {
      console.error('Failed to parse replay:', err);
      // Fallback to demo mode on any error
      try {
        const demoData = generateDemoData(file.name, file.size);
        setReplayData(demoData);
      } catch {
        setError(err instanceof Error ? err.message : 'Failed to parse replay file');
      }
    }
  }, [setReplayData, setLoading, setError]);

  if (isLoaded) {
    return <ReplayViewer />;
  }

  return <UploadZone onFileSelected={handleFileSelected} isLoading={isLoading} error={loadError} />;
}
