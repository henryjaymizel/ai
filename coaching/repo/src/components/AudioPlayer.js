'use client';
import { useState } from 'react';

const SECTIONS = [
  { id: 'header', label: 'Header', time: 0 },
  { id: 'scores', label: 'Score Summary', time: 15 },
  { id: 'trend', label: 'Progress Trend', time: 35 },
  { id: 'pillars', label: 'Pillar Breakdown', time: 60 },
  { id: 'playbook', label: 'Next Call Playbook', time: 95 },
];

export default function AudioPlayer({ repName, score, band }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState(0);

  const totalDuration = 120;

  function togglePlay() {
    setPlaying(!playing);
    if (!playing) {
      // Simulate playback progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) { clearInterval(interval); setPlaying(false); return 0; }
          return prev + (speed * 100) / (totalDuration * 10);
        });
      }, 100);
    }
  }

  function jumpTo(sectionIdx) {
    setCurrentSection(sectionIdx);
    setProgress((SECTIONS[sectionIdx].time / totalDuration) * 100);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Audio Coaching Summary</h3>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-4 cursor-pointer" onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        setProgress(((e.clientX - rect.left) / rect.width) * 100);
      }}>
        <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700">
          {playing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <span className="text-sm text-gray-500">
          {Math.floor((progress / 100) * totalDuration / 60)}:{String(Math.floor((progress / 100) * totalDuration % 60)).padStart(2, '0')}
          {' / '}
          {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500">Speed:</span>
          {[0.8, 1.0, 1.2, 1.5].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs ${speed === s ? 'bg-brand-100 text-brand-700 font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Section navigation */}
      <div className="flex gap-1 flex-wrap">
        {SECTIONS.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => jumpTo(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              i === currentSection
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        TTS-narrated coaching summary for {repName}. Score: {score}/10 ({band}).
      </p>
    </div>
  );
}
