'use client';

import { useState } from 'react';
import type { FAQItem } from '@/lib/api/client';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { FAQSkeleton } from '@/components/ui/Skeleton';

interface FAQBlockProps {
  items: FAQItem[] | null;
  loading?: boolean;
}

const FALLBACK_FAQ: FAQItem[] = [
  {
    id: '1',
    question: 'Как создать команду?',
    answer: 'Перейдите в раздел «Команды» и нажмите «Создать команду». Заполните название, описание и пригласите участников.',
  },
  {
    id: '2',
    question: 'Как участвовать в игре?',
    answer: 'Выберите игру из каталога, зарегистрируйте команду и дождитесь старта. В назначенное время начните прохождение.',
  },
  {
    id: '3',
    question: 'Как стать организатором?',
    answer: 'Подайте заявку в разделе «Организаторам». После проверки модератором вы сможете создавать свои игры.',
  },
  {
    id: '4',
    question: 'Как проходит игра?',
    answer: 'Игра состоит из последовательности заданий (миссий). Команды выполняют их в реальном времени, получая баллы за правильные ответы.',
  },
];

function FAQContent({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const faqItems = items.length > 0 ? items : FALLBACK_FAQ;

  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-6">
        Часто задаваемые вопросы
      </h2>

      <div className="space-y-3">
        {faqItems.map((item) => (
          <div
            key={item.id}
            className="card overflow-hidden"
          >
            <button
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="w-full flex items-center justify-between text-left p-4"
              aria-expanded={openId === item.id}
            >
              <span className="text-sm font-medium text-text-primary pr-4">
                {item.question}
              </span>
              <svg
                className={`w-5 h-5 text-text-muted shrink-0 transition-transform ${
                  openId === item.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openId === item.id && (
              <div className="px-4 pb-4">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FAQBlock(props: FAQBlockProps) {
  if (props.loading) return <FAQSkeleton />;

  return (
    <ErrorBoundary blockName="FAQ">
      <FAQContent items={props.items || []} />
    </ErrorBoundary>
  );
}