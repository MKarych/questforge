'use client';

import { useState, useCallback } from 'react';
import {
  runFullIntegrationTest,
  IntegrationTestReport,
  IntegrationTestResult,
} from '@/lib/engine-integration/engine-integration';

export default function EngineTestPage() {
  const [report, setReport] = useState<IntegrationTestReport | null>(null);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const runTests = useCallback(() => {
    setRunning(true);
    setReport(null);

    // Используем setTimeout, чтобы UI обновился до начала тестов
    setTimeout(() => {
      try {
        const result = runFullIntegrationTest();
        setReport(result);
      } catch (err: any) {
        setReport({
          total: 1,
          passed: 0,
          failed: 1,
          results: [{
            name: 'CRASH',
            passed: false,
            expected: 'no crash',
            actual: err.message,
            error: err.stack,
          }],
          summary: `💥 CRASH: ${err.message}`,
        });
      } finally {
        setRunning(false);
      }
    }, 100);
  }, []);

  const filteredResults = report
    ? report.results.filter((r) => {
        if (filter === 'passed') return r.passed;
        if (filter === 'failed') return !r.passed;
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🧪 Engine Integration Tests</h1>
        <p className="text-gray-600 mb-6">
          Полный интеграционный тест: Editor → JSON → GameSession → ExecutionEngine
        </p>

        {/* Кнопка запуска */}
        <button
          onClick={runTests}
          disabled={running}
          className={`
            px-6 py-3 rounded-lg font-semibold text-white text-lg
            ${running
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }
            transition-colors shadow-md
          `}
        >
          {running ? '⏳ Запуск тестов...' : '🚀 Запустить все тесты'}
        </button>

        {/* Сводка */}
        {report && (
          <div className={`mt-6 p-6 rounded-xl border-2 shadow-lg ${
            report.failed === 0
              ? 'bg-green-50 border-green-400'
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${
                  report.failed === 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {report.failed === 0 ? '✅ ВСЁ РАБОТАЕТ' : '⚠️ ЕСТЬ ПРОБЛЕМЫ'}
                </h2>
                <p className="text-gray-700 mt-1 text-lg">{report.summary}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-800">
                  {report.passed}/{report.total}
                </div>
                <div className="text-sm text-gray-500">тестов пройдено</div>
              </div>
            </div>

            {/* Прогресс-бар */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.failed === 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${(report.passed / report.total) * 100}%` }}
              />
            </div>

            {/* Статистика */}
            <div className="mt-4 flex gap-4 text-sm">
              <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full font-medium">
                ✅ {report.passed} passed
              </span>
              <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full font-medium">
                ❌ {report.failed} failed
              </span>
              <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full font-medium">
                📊 {report.total} total
              </span>
            </div>
          </div>
        )}

        {/* Фильтры */}
        {report && (
          <div className="mt-4 flex gap-2">
            {(['all', 'passed', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f === 'all' ? 'Все' : f === 'passed' ? '✅ Пройденные' : '❌ Проваленные'}
              </button>
            ))}
          </div>
        )}

        {/* Результаты тестов */}
        {report && (
          <div className="mt-4 space-y-2">
            {filteredResults.map((result, idx) => (
              <TestResultCard key={idx} result={result} index={idx + 1} />
            ))}
          </div>
        )}

        {/* Инструкция */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
          <strong>📋 Инструкция:</strong>
          <ol className="list-decimal ml-5 mt-1 space-y-1">
            <li>Нажмите <strong>"Запустить все тесты"</strong></li>
            <li>Дождитесь завершения (обычно {'<'}1 сек)</li>
            <li>Проверьте сводку — если все зелёное, значит <strong>ВСЁ РАБОТАЕТ</strong></li>
            <li>Если есть красное — откройте консоль (F12) для деталей</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function TestResultCard({ result, index }: { result: IntegrationTestResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-l-4 rounded-lg p-4 shadow-sm transition-colors cursor-pointer ${
        result.passed
          ? 'bg-green-50 border-green-500 hover:bg-green-100'
          : 'bg-red-50 border-red-500 hover:bg-red-100'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{result.passed ? '✅' : '❌'}</span>
          <span className="font-medium text-gray-800">
            #{index}: {result.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            result.passed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}>
            {result.passed ? 'PASS' : 'FAIL'}
          </span>
          <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pl-8 space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Expected:</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">
              {JSON.stringify(result.expected)}
            </code>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-20">Actual:</span>
            <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800">
              {JSON.stringify(result.actual)}
            </code>
          </div>
          {result.error && (
            <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs font-mono whitespace-pre-wrap">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}