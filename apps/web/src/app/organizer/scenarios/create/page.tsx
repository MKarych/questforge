'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';

interface ScenarioNode {
  id: string;
  type: string;
  question: string;
  answer?: string;
  timer?: number;
}

export default function CreateScenarioPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [loading, setLoading] = useState(false);

  const nodeTypes = [
    { value: 'text', label: 'Текстовое задание' },
    { value: 'code', label: 'Код' },
    { value: 'photo', label: 'Фото' },
    { value: 'gps', label: 'GPS' },
    { value: 'qr', label: 'QR-код' },
    { value: 'choice', label: 'Выбор варианта' },
  ];

  const addNode = () => {
    const newNode: ScenarioNode = {
      id: `node-${nodes.length + 1}`,
      type: 'text',
      question: '',
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (index: number, field: keyof ScenarioNode, value: string) => {
    const newNodes = [...nodes];
    newNodes[index] = { ...newNodes[index], [field]: value };
    setNodes(newNodes);
  };

  const removeNode = (index: number) => {
    setNodes(nodes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || nodes.length === 0) return;

    setLoading(true);

    try {
      // In a real implementation, this would call the API
      console.log('Creating scenario:', { name, nodes });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      router.push('/organizer/dashboard');
    } catch (err) {
      console.error('Failed to create scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/organizer/dashboard" className="text-text-secondary hover:text-text-primary text-sm">
              ← Назад к панели
            </Link>
          </div>

          <div className="card">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Создать сценарий</h1>
            <p className="text-text-secondary mb-6">
              Разработайте маршрут игры с заданиями
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Название сценария</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Тайны старого города"
                  className="input-field"
                  required
                />
              </div>

              {/* Nodes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Задания</h2>
                  <button
                    type="button"
                    onClick={addNode}
                    className="btn-secondary text-sm"
                  >
                    + Добавить задание
                  </button>
                </div>

                {nodes.length === 0 ? (
                  <div className="card border-dashed border-2 border-border text-center py-8">
                    <p className="text-text-secondary mb-4">
                      Добавьте первое задание для начала
                    </p>
                    <button type="button" onClick={addNode} className="btn-primary">
                      Добавить задание
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nodes.map((node, index) => (
                      <div key={node.id} className="card border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-text-primary">
                            Задание {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNode(index)}
                            className="text-error hover:text-error/80 text-sm"
                          >
                            Удалить
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="label">Тип задания</label>
                            <select
                              value={node.type}
                              onChange={(e) => updateNode(index, 'type', e.target.value)}
                              className="input-field"
                            >
                              {nodeTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {(node.type === 'text' || node.type === 'code') && (
                            <div>
                              <label className="label">Ответ</label>
                              <input
                                type="text"
                                value={node.answer || ''}
                                onChange={(e) => updateNode(index, 'answer', e.target.value)}
                                placeholder="Правильный ответ"
                                className="input-field"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="label">Текст задания</label>
                          <textarea
                            value={node.question}
                            onChange={(e) => updateNode(index, 'question', e.target.value)}
                            placeholder="Опишите задание для участников..."
                            className="input-field min-h-[80px]"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !name.trim() || nodes.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Сохранение...' : 'Сохранить сценарий'}
                  </button>
                  <Link href="/organizer/dashboard" className="btn-secondary">
                    Отмена
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
