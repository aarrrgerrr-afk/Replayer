'use client';

import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileVideo, Zap, Users, Map, Crosshair, AlertCircle, Play } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export default function UploadZone({ onFileSelected, isLoading, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.[0]) onFileSelected(e.dataTransfer.files[0]);
    },
    [onFileSelected]
  );

  const handleDemo = useCallback(() => {
    onFileSelected(new File(['demo'], 'Demo_Replay.replay', { type: 'application/octet-stream' }));
  }, [onFileSelected]);

  return (
    <div className="min-h-screen animated-gradient flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-12 max-w-3xl"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fn-purple to-fn-blue flex items-center justify-center glow-purple">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
            <span className="text-glow-purple">Replay</span>{' '}
            <span className="text-fn-blue text-glow-blue">Viewer</span>
          </h1>
        </div>
        <p className="text-fn-gray text-lg md:text-xl font-light leading-relaxed">
          Upload your Fortnite <span className="text-fn-purple font-medium">.replay</span> files and explore every match
          in a fully interactive <span className="text-fn-blue font-medium">3D viewer</span>.
          Track players, analyze storm rotations, and relive every elimination.
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-wrap justify-center gap-3 mb-10 max-w-2xl"
      >
        {[
          { icon: Map, label: '3D Map', color: 'text-fn-purple' },
          { icon: Users, label: '50-100 Players', color: 'text-fn-blue' },
          { icon: Crosshair, label: 'Kill Tracking', color: 'text-fn-red' },
          { icon: Zap, label: 'Storm Analysis', color: 'text-fn-gold' },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-fn-card/80 border border-fn-border/50 backdrop-blur-sm"
          >
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-sm text-fn-gray">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-xl"
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isLoading && inputRef.current?.click()}
          className={`
            relative group cursor-pointer rounded-2xl border-2 border-dashed
            transition-all duration-300 p-12
            ${isDragging
              ? 'border-fn-purple bg-fn-purple/10 scale-[1.02] glow-purple'
              : 'border-fn-border hover:border-fn-purple/50 hover:bg-fn-card/50'
            }
            ${isLoading ? 'pointer-events-none opacity-70' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".replay,.bin"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFileSelected(e.target.files[0])}
          />

          <div className="flex flex-col items-center gap-4 text-center">
            {isLoading ? (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-fn-purple/30 border-t-fn-purple spin-slow" />
                <p className="text-fn-purple font-medium">Parsing replay file...</p>
                <p className="text-fn-gray text-sm">This may take a moment for large files</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-fn-card flex items-center justify-center border border-fn-border group-hover:border-fn-purple/50 transition-colors">
                  <FileVideo className="w-8 h-8 text-fn-purple group-hover:text-fn-purple-light transition-colors" />
                </div>
                <div>
                  <p className="text-fn-white font-medium text-lg">
                    Drop your replay file here
                  </p>
                  <p className="text-fn-gray text-sm mt-1">
                    or click to browse • .replay files supported
                  </p>
                </div>
                <div className="flex items-center gap-2 text-fn-gray/50 text-xs">
                  <Upload className="w-3 h-3" />
                  <span>Fortnite Chapter 1-5 supported</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 rounded-xl bg-fn-red/10 border border-fn-red/30 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-fn-red flex-shrink-0" />
              <p className="text-fn-red text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Mode Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleDemo(); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-fn-card border border-fn-border hover:border-fn-purple/50 hover:bg-fn-card-hover transition-all text-fn-gray hover:text-fn-purple"
          >
            <Zap className="w-4 h-4" />
            <span className="font-medium">Try Demo Mode</span>
            <span className="text-xs text-fn-gray/50">— no file needed</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-center text-fn-gray/40 text-xs max-w-lg"
      >
        <p>
          Your replay files are processed entirely in your browser.
          <br />
          No data is uploaded to any server — 100% client-side.
        </p>
      </motion.div>
    </div>
  );
}
