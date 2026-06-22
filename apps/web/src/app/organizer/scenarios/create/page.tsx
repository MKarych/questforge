'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import ScenarioEditor from '@/components/scenario-editor/ScenarioEditor';

export default function CreateScenarioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: any) => {
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          nodes: data.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
          })),
          edges: data.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
          })),
          startNodeId: data.startNodeId,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при сохранении сценария');
      }

      await response.json();
      alert('✅ Сценарий успешно сохранён!');
      router.push('/organizer/scenarios');
    } catch (err) {
      console.error('Failed to create scenario:', err);
      alert('❌ Не удалось сохранить сценарий');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
        <ScenarioEditor onSave={handleSave} />
      </div>
      {saving && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-background p-6 rounded-lg shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-4">💾</div>
              <div className="text-lg font-semibold text-text-primary">Сохранение...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
