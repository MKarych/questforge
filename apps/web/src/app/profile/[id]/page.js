"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PublicProfilePage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const Header_1 = __importDefault(require("@/components/ui/Header"));
const LoadingSpinner_1 = __importDefault(require("@/components/ui/LoadingSpinner"));
const useUser_1 = require("@/hooks/useUser");
const client_1 = require("@/lib/api/client");
function PublicProfilePage() {
    const params = (0, navigation_1.useParams)();
    const { user } = (0, useUser_1.useUser)();
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [myTeams, setMyTeams] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        async function loadProfile() {
            try {
                const response = await client_1.apiClient.get(`/users/${params.id}`);
                setProfile(response.data);
                try {
                    const teamsResponse = await (0, client_1.getMyTeams)();
                    if (teamsResponse.data && Array.isArray(teamsResponse.data)) {
                        setMyTeams(teamsResponse.data);
                    }
                }
                catch {
                    // Игнорируем ошибки загрузки команд
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки');
            }
            finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [params.id]);
    if (loading) {
        return (<div className="min-h-screen">
        <Header_1.default />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner_1.default size="lg"/>
        </div>
      </div>);
    }
    if (error || !profile) {
        return (<div className="min-h-screen">
        <Header_1.default />
        <div className="container mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <div className="text-6xl mb-6">😕</div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              {error || 'Профиль не найден'}
            </h1>
            <link_1.default href="/games" className="btn-primary">
              Вернуться к играм
            </link_1.default>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen">
      <Header_1.default />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile.avatar ? (<img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover"/>) : (<span className="text-5xl text-primary">
                    {profile.username?.charAt(0)?.toUpperCase() || '?'}
                  </span>)}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row gap-3 items-center md:items-start mb-2">
                  <h1 className="text-3xl font-bold text-text-primary">
                    @{profile.username}
                  </h1>
                  {user?.uuid === profile.uuid && (<link_1.default href="/profile/edit" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Редактировать
                    </link_1.default>)}
                </div>

                {profile.city && (<p className="text-text-secondary mb-2">📍 {profile.city}</p>)}

                {profile.bio && (<p className="text-text-secondary mb-4 max-w-xl">{profile.bio}</p>)}
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">
                  {profile.rating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-text-secondary">рейтинг</div>
                <div className="text-lg font-semibold text-text-primary mt-2">
                  🤝 {profile.trustScore || 0}%
                </div>
                <div className="text-sm text-text-secondary">доверие</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesPlayed}</div>
              <div className="text-sm text-text-secondary">Игр пройдено</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesCreated}</div>
              <div className="text-sm text-text-secondary">Игр создано</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.gamesConducted}</div>
              <div className="text-sm text-text-secondary">Игр проведено</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-primary">{profile.scenariosCreated}</div>
              <div className="text-sm text-text-secondary">Сценариев</div>
            </div>
          </div>

          {/* Followers info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card text-center p-4">
              <div className="text-2xl font-bold text-primary">{profile.followersCount}</div>
              <div className="text-sm text-text-secondary">Подписчиков</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-2xl font-bold text-primary">{profile.followingCount}</div>
              <div className="text-sm text-text-secondary">Подписок</div>
            </div>
          </div>

          {/* My Teams */}
          {myTeams.length > 0 && (<div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">🏴 Мои команды</h2>
                <link_1.default href="/teams" className="text-primary hover:text-primary-hover text-sm font-medium">
                  Все команды →
                </link_1.default>
              </div>
              <div className="space-y-3">
                {myTeams.map((team) => (<link_1.default key={team.id} href={`/teams/${team.id}`} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{team.name}</div>
                        <div className="text-xs text-text-secondary">
                          {team.membersCount} участников
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${team.myRole === 'captain'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'}`}>
                        {team.myRole === 'captain' ? '👑 Капитан' : 'Участник'}
                      </span>
                      <span className="text-text-secondary">→</span>
                    </div>
                  </link_1.default>))}
              </div>
            </div>)}

          {/* Achievements */}
          {profile.achievements && profile.achievements.length > 0 && (<div className="card mb-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">🏆 Достижения</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.achievements.map((achievement) => (<div key={achievement.id} className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <div className="font-semibold text-text-primary text-sm mb-1">
                      {achievement.name}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {achievement.description}
                    </div>
                  </div>))}
              </div>
            </div>)}

          {/* Activity Info */}
          <div className="card">
            <h2 className="text-xl font-bold text-text-primary mb-4">📊 Активность</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-text-secondary">На платформе с</div>
                <div className="text-text-primary">
                  {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Был в сети</div>
                <div className="text-text-primary">
                  {profile.lastSeenAt
            ? new Date(profile.lastSeenAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
            : 'Давно'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map