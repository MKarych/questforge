'use client';

import dynamic from 'next/dynamic';

const ScenarioEditorV2 = dynamic(
  () => import('@/components/editor-v2/ScenarioEditor'),
  { ssr: false }
);

export default function DebugEditorTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">🧪 Debug: Editor Test</span>
        <span className="text-xs text-text-secondary">React Flow v11.11.4</span>
      </div>
      <ScenarioEditorV2 />
    </div>
  );
}