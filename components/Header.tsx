'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Menu, X, Calendar, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ModeToggle } from './mode-toggle';
import { Logo } from './Logo';
// import { auth } from '@/lib/auth/auth';

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getDashboardPath = () => {
    if (!user) return '/auth/login';
    return `/dashboard/${user.role}`;
  };

  const handleLogout = () => {
    logout()
    router.refresh();
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950 backdrop-blur-md border-b border-pink-100 dark:border-pink-900 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Logo width={200} height={60} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`transition-colors text-lg ${isActive('/') ? 'text-pink-500' : 'text-gray-700 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500'
                }`}
            >
              Accueil
            </Link>
            <Link
              href="/catalog"
              className={`transition-colors text-lg ${isActive('/catalog') ? 'text-pink-500' : 'text-gray-700 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500'
                }`}
            >
              Catalogue
            </Link>
            {/* <Link
              href="/services"
              className={`transition-colors text-lg ${isActive('/services') ? 'text-pink-500' : 'text-gray-700 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500'
                }`}
            >
              Services
            </Link> */}
            <Link
              href="/memberships"
              className={`transition-colors text-lg ${isActive('/memberships') ? 'text-pink-500' : 'text-gray-700 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500'
                }`}
            >
              Abonnements
            </Link>
            <Link
              href="/about"
              className={`transition-colors text-lg ${isActive('/about') ? 'text-pink-500' : 'text-gray-700 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500'
                }`}
            >
              À Propos
            </Link>
            <Link
              href="/contact"
              className={`transition-colors text-lg ${isActive('/contact') ? 'text-pink-500' : 'text-gray-700 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-500'
                }`}
            >
              Contact
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ModeToggle />
            {user ? (
              <>
                <Link href={getDashboardPath()}>
                  <Button variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                    {user.role === 'client' ? 'Mon Espace' : user.role === 'worker' ? 'Mes Tâches' : 'Admin'}
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-400 hover:text-pink-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-pink-200 ">
                    Connexion
                  </Button>
                </Link>
                <Link href="/appointments">
                  <Button className="bg-linear-to-br from-gray-900 via-pink-800 to-pink-600 hover:from-pink-600 hover:via-pink-800 hover:to-gray-900 text-white rounded-full px-6">
                    <Calendar className="w-4 h-4 mr-2" />
                    Réserver
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-800 transition-colors text-lg"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-pink-100 dark:border-pink-900">
            <div className="flex flex-col space-y-4">
              <div className="px-4 py-2 flex justify-between items-center">
                <span className="text-lg text-gray-600 dark:text-gray-400">Thème</span>
                <ModeToggle />
              </div>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition-colors text-lg ${isActive('/') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800'
                  }`}
              >
                Accueil
              </Link>
              <Link
                href="/catalog"
                className={`px-4 py-2 rounded-lg transition-colors text-lg ${isActive('/services') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800'
                  }`}
              >
                Catalogue
              </Link>
              {/* <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition-colors text-lg ${isActive('/services') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800'
                  }`}
              >
                Services
              </Link> */}
              <Link
                href="/memberships"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition-colors text-lg ${isActive('/memberships') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800'
                  }`}
              >
                Abonnements
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition-colors text-lg ${isActive('/about') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800'
                  }`}
              >
                À Propos
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg transition-colors text-lg ${isActive('/contact') ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-500' : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800'
                  }`}
              >
                Contact
              </Link>
              {user ? (
                <>

                  <Button variant="outline" onClick={() => {
                    router.push(getDashboardPath());
                    () => setMobileMenuOpen(false)
                  }} className="w-full px-4 py-2 border-pink-200 text-pink-600">
                    {user.role === 'client' ? 'Mon Espace' : user.role === 'worker' ? 'Mes Tâches' : 'Admin'}
                  </Button>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false);
                      router.refresh();
                    }}
                    className="px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800 rounded-lg"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2"
                  >
                    <Button variant="outline" className="w-full text-gray-700 dark:text-gray-300 hover:text-pink-800 dark:hover:text-pink-700">
                      Connexion
                    </Button>
                  </Link>
                  <Link
                    href="/appointments"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2"
                  >
                    <Button className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Réserver
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
