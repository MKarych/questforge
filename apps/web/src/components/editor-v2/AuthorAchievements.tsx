'use client';

import { useState } from 'react';
import { AuthorAchievement, AUTHOR_ACHIEVEMENTS } from '@/lib/author-achievements/author-achievements';

interface AuthorAchievementsProps {
  unlockedIds: string[];
  newAchievements: AuthorAchievement[];
  onDismissNew: () => void;
}

export default function AuthorAchievements({ unlockedIds, newAchievements, onDismissNew }: AuthorAchievementsProps) {
  const [showAll, setShowAll] = useState(false);
  const unlockedCount = unlockedIds.length;
  const totalCount = AUTHOR_ACHIEVEMENTS.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setShowAll(!showAll)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/50 border border-border hover:bg-background hover:border-primary/30 transition-all text-xs"
        title="Достижения автора"
      >
        <span className="text-sm">🏆</span>
        <span className="font-semibold text-text-primary">{unlockedCount}</span>
        <span className="text-text-secondary">/{totalCount}</span>
        {/* Progress bar */}
        <div className="w-12 h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* New achievements badge */}
        {newAchievements.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center animate-bounce">
            {newAchievements.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showAll && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowAll(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-3 border-b border-border bg-gradient-to-r from-yellow-500/10 to-yellow-500/5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-text-primary">🏆 Достижения автора</h3>
                <span className="text-[10px] text-text-secondary">{unlockedCount}/{totalCount}</span>
              </div>
              <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* New achievements notification */}
            {newAchievements.length > 0 && (
              <div className="p-3 bg-green-500/10 border-b border-green-500/20">
                <p className="text-[11px] font-semibold text-green-400 mb-2">🎉 Новые достижения!</p>
                <div className="space-y-1.5">
                  {newAchievements.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-xs">
                      <span className="text-lg animate-bounce">{a.icon}</span>
                      <div>
                        <span className="font-semibold text-text-primary">{a.name}</span>
                        <p className="text-[10px] text-text-secondary">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onDismissNew}
                  className="mt-2 text-[10px] text-primary hover:text-primary/80"
                >
                  ✕ Понятно
                </button>
              </div>
            )}

            {/* Achievement list */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
              {AUTHOR_ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedIds.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                      isUnlocked
                        ? 'bg-yellow-500/5'
                        : 'opacity-50'
                    }`}
                  >
                    <span className={`text-lg ${isUnlocked ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {achievement.name}
                      </span>
                      <p className="text-[10px] text-text-secondary truncate">
                        {achievement.description}
                      </p>
                    </div>
                    {isUnlocked && (
                      <span className="text-[10px] text-green-400 shrink-0">✅</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}