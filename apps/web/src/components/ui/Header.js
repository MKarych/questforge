"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Header;
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/api/client");
function Header() {
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    const [mobileMenuOpen, setMobileMenuOpen] = (0, react_1.useState)(false);
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        async function loadProfile() {
            try {
                const response = await (0, client_1.getProfile)();
                setUser(response.data);
            }
            catch {
                setUser(null);
            }
            finally {
                setLoading(false);
            }
        }
        // Синхронизация: если токен есть, но user отсутствует — загружаем профиль
        if (token && !user) {
            loadProfile();
        }
        // Загружаем профиль на страницах авторизации, админки, дашборда и профиля
        if (pathname.startsWith('/auth') || pathname.startsWith('/organizer') || pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/admin')) {
            loadProfile();
        }
        else {
            setLoading(false);
        }
    }, [pathname]);
    const handleLogout = async () => {
        try {
            await (0, client_1.logout)();
        }
        finally {
            setUser(null);
            router.push('/');
        }
    };
    const isAuthPage = pathname.startsWith('/auth');
    return (<header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <link_1.default href="/" className="flex items-center gap-3">
            <image_1.default src="/images/logo/logo.png" alt="Adventure Engine" width={40} height={40} className="h-8 w-auto"/>
            <span className="text-xl font-bold text-white hidden sm:block">
              Город Приключений
            </span>
          </link_1.default>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <link_1.default href="/games" className="text-text-secondary hover:text-text-primary transition-colors">
              Игры
            </link_1.default>
            {user && (<link_1.default href="/teams" className="text-text-secondary hover:text-text-primary transition-colors">
                Команды
              </link_1.default>)}
            <link_1.default href="/organizer" className="text-text-secondary hover:text-text-primary transition-colors">
              Организаторам
            </link_1.default>
            {!loading && (user ? (<div className="flex items-center gap-4">
                  {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (<link_1.default href="/admin/dashboard" className="text-primary hover:text-primary-hover transition-colors font-medium">
                      Админка
                    </link_1.default>)}
                  <link_1.default href="/organizer/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                    Панель
                  </link_1.default>
                  <link_1.default href="/organizer/games" className="text-text-secondary hover:text-text-primary transition-colors">
                    Игры
                  </link_1.default>
                  <link_1.default href="/organizer/scenarios" className="text-text-secondary hover:text-text-primary transition-colors">
                    Сценарии
                  </link_1.default>
                  <link_1.default href={`/profile/${user.id}`} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (<img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/>) : (<span className="text-sm text-primary font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>)}
                    </div>
                  </link_1.default>
                  <button onClick={handleLogout} className="btn-secondary">
                    Выйти
                  </button>
                </div>) : !isAuthPage && (<>
                  <link_1.default href="/auth/login" className="btn-secondary">
                    Войти
                  </link_1.default>
                  <link_1.default href="/auth/register" className="btn-primary">
                    Регистрация
                  </link_1.default>
                </>))}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-text-secondary hover:text-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>)}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (<nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
            <link_1.default href="/games" className="text-text-secondary hover:text-text-primary transition-colors">
              Игры
            </link_1.default>
            {user && (<link_1.default href="/teams" className="text-text-secondary hover:text-text-primary transition-colors">
                Команды
              </link_1.default>)}
            <link_1.default href="/organizer" className="text-text-secondary hover:text-text-primary transition-colors">
              Организаторам
            </link_1.default>
              {!loading && (user ? (<div className="flex flex-col gap-3 pt-2">
                    <link_1.default href="/organizer/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                      Панель
                    </link_1.default>
                    <link_1.default href="/organizer/games" className="text-text-secondary hover:text-text-primary transition-colors">
                      Игры
                    </link_1.default>
                    <link_1.default href="/organizer/scenarios" className="text-text-secondary hover:text-text-primary transition-colors">
                      Сценарии
                    </link_1.default>
                    <link_1.default href={`/profile/${user.id}`} className="flex items-center gap-3 text-text-secondary hover:text-text-primary transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (<img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/>) : (<span className="text-sm text-primary font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>)}
                      </div>
                      <span className="text-text-secondary text-sm">{user.name}</span>
                    </link_1.default>
                    <button onClick={handleLogout} className="btn-secondary">
                      Выйти
                    </button>
                  </div>) : !isAuthPage && (<div className="flex gap-3 pt-2">
                    <link_1.default href="/auth/login" className="btn-secondary flex-1 text-center">
                      Войти
                    </link_1.default>
                    <link_1.default href="/auth/register" className="btn-primary flex-1 text-center">
                      Регистрация
                    </link_1.default>
                  </div>))}
            </div>
          </nav>)}
      </div>
    </header>);
}
//# sourceMappingURL=Header.js.map