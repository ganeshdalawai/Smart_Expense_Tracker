import React, { useEffect } from 'react';
import {
  useNavigate,
  useLocation
} from 'react-router-dom';

import {
  LayoutDashboard,
  CreditCard,
  Target,
  Brain,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Tag
} from 'lucide-react';
import { useCurrency } from '../settings/CurrencySelector';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onLogout
}) => {

  const navigate = useNavigate();
  const location = useLocation();

  const { currency } =
    useCurrency();

  // ============================================================
  // MENU ITEMS
  // ============================================================

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      path: '/transactions'
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: Target,
      path: '/budget'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Tag,
      path: '/categories'
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Brain,
      path: '/insights'
    }
  ];

  // ============================================================
  // USER DATA
  // ============================================================

  const getUserData = () => {

    try {

      const userData =
        localStorage.getItem('user');

      return userData
        ? JSON.parse(userData)
        : null;

    } catch (error) {

      console.error(
        'Error parsing user data:',
        error
      );

      return null;
    }
  };

  const user =
    getUserData();

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {

    onLogout();

    navigate('/login');
  };

  // ============================================================
  // ROOT REDIRECT
  // ============================================================

  useEffect(() => {

    if (
      location.pathname === '/'
    ) {

      navigate(
        '/dashboard',
        {
          replace: true
        }
      );

    }

  }, [
    location.pathname,
    navigate
  ]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigation = (
    path: string
  ) => {

    navigate(path);

  };

  // ============================================================
  // SETTINGS
  // ============================================================

  const handleSettings = () => {

    navigate('/settings');

  };

  // ============================================================
  // INITIALS
  // ============================================================

  const getInitials = () => {

    if (!user?.name) {
      return 'U';
    }

    return user.name
      .split(' ')
      .map(
        (name: string) =>
          name[0]
      )
      .join('')
      .toUpperCase();
  };

  // ============================================================
  // UI
  // ============================================================

  return (

    <div
      className={`
        fixed
        left-0
        top-0
        h-screen
        z-50

        bg-white/90
        dark:bg-slate-900/95

        backdrop-blur-xl

        border-r
        border-gray-200/30
        dark:border-slate-700/30

        shadow-2xl
        shadow-black/10
        dark:shadow-black/30

        transition-all
        duration-300

        ${
          isCollapsed
            ? 'w-16'
            : 'w-64'
        }

        hidden
        md:flex
        flex-col
      `}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          h-16
          px-4
          border-b
          border-gray-200/30
          dark:border-slate-700/30
          flex
          items-center
          justify-between
          flex-shrink-0
        "
      >

        {!isCollapsed && (

          <div
            className="
              flex
              items-center
              space-x-3
            "
          >

            <div
              className="
                w-8
                h-8
                bg-gradient-to-br
                from-cyan-500
                to-teal-600
                rounded-xl
                flex
                items-center
                justify-center
                shadow-lg
                shadow-cyan-500/25
              "
            >

              <svg
                className="
                  w-5
                  h-5
                  text-white
                "
                fill="currentColor"
                viewBox="0 0 20 20"
              >

                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />

              </svg>

            </div>

            <h1
              className="
                text-xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              FinTrack
            </h1>

          </div>

        )}

        <button
          onClick={
            onToggleCollapse
          }
          className="
            p-2
            rounded-xl
            hover:bg-gray-100/80
            dark:hover:bg-slate-800/80
            transition-colors
          "
        >

          {isCollapsed ? (

            <ChevronRight
              className="
                w-5
                h-5
                text-gray-600
                dark:text-gray-300
              "
            />

          ) : (

            <ChevronLeft
              className="
                w-5
                h-5
                text-gray-600
                dark:text-gray-300
              "
            />

          )}

        </button>

      </div>

      {/* ======================================================
          CURRENCY
      ====================================================== */}

      {!isCollapsed && (

        <div
          className="
            px-4
            py-3
            border-b
            border-gray-200/30
            dark:border-slate-700/30
          "
        >

          <div
            className="
              flex
              items-center
              space-x-2
              text-sm
              text-gray-600
              dark:text-gray-300
            "
          >

            <Globe
              className="
                w-4
                h-4
              "
            />

            <span>
              Currency:{' '}
              {currency.flag}{' '}
              {currency.code}
            </span>

          </div>

        </div>

      )}

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav
        className="
          flex-1
          px-3
          py-4
          min-h-0
        "
      >

        <ul
          className="
            space-y-1
          "
        >

          {menuItems.map(
            (item) => {

              const Icon =
                item.icon;

              const isActive =
                location.pathname ===
                item.path;

              return (

                <li
                  key={item.id}
                >

                  <button
                    onClick={() =>
                      handleNavigation(
                        item.path
                      )
                    }
                    className={`
                      w-full
                      flex
                      items-center
                      space-x-3
                      px-3
                      py-3
                      rounded-xl
                      transition-all
                      duration-300
                      group

                      ${
                        isActive

                          ? `
                            bg-gradient-to-r
                            from-cyan-500/20
                            to-teal-500/20
                            dark:from-cyan-500/20
                            dark:to-teal-500/20

                            text-cyan-600
                            dark:text-cyan-400

                            border
                            border-cyan-500/30
                            dark:border-cyan-500/30

                            shadow-lg
                            shadow-cyan-500/10

                            scale-105
                          `

                          : `
                            text-gray-600
                            dark:text-gray-300

                            hover:bg-gray-100/80
                            dark:hover:bg-slate-800/80

                            hover:text-gray-900
                            dark:hover:text-white

                            hover:scale-102
                          `
                      }
                    `}
                  >

                    <Icon
                      className={`
                        w-5
                        h-5
                        flex-shrink-0
                        transition-all
                        duration-300

                        ${
                          isActive

                            ? `
                              text-cyan-600
                              dark:text-cyan-400
                              scale-110
                            `

                            : `
                              text-gray-500
                              dark:text-gray-400
                              group-hover:scale-105
                            `
                        }
                      `}
                    />

                    {!isCollapsed && (

                      <span
                        className="
                          font-medium
                          truncate
                        "
                      >
                        {item.label}
                      </span>

                    )}

                  </button>

                </li>

              );

            }
          )}

        </ul>

      </nav>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div
        className="
          px-3
          pb-4
          flex-shrink-0
          space-y-3
        "
      >

        {/* ==================================================
            ACTION BUTTONS
        ================================================== */}

        <div
          className="
            space-y-1
          "
        >

          {/* SETTINGS */}

          <button
            onClick={
              handleSettings
            }
            className={`
              w-full
              flex
              items-center
              space-x-3
              px-3
              py-3
              rounded-xl

              text-gray-600
              dark:text-gray-300

              hover:bg-gray-100/80
              dark:hover:bg-slate-800/80

              hover:text-gray-900
              dark:hover:text-white

              transition-all
              duration-300
              group

              ${
                location.pathname ===
                '/settings'
                  ? `
                    bg-cyan-500/10
                    dark:bg-cyan-500/10
                    text-cyan-600
                    dark:text-cyan-400
                    border
                    border-cyan-500/20
                  `
                  : ''
              }

              ${
                isCollapsed
                  ? 'justify-center'
                  : ''
              }
            `}
          >

            <Settings
              className={`
                w-5
                h-5
                flex-shrink-0

                ${
                  location.pathname ===
                  '/settings'
                    ? `
                      text-cyan-600
                      dark:text-cyan-400
                    `
                    : ''
                }

                group-hover:rotate-90
                transition-transform
                duration-300
              `}
            />

            {!isCollapsed && (

              <span
                className="
                  truncate
                "
              >
                Settings
              </span>

            )}

          </button>

          {/* LOGOUT */}

          <button
            onClick={
              handleLogout
            }
            className={`
              w-full
              flex
              items-center
              space-x-3
              px-3
              py-3
              rounded-xl

              text-red-500
              dark:text-red-400

              hover:bg-red-50/80
              dark:hover:bg-red-500/10

              transition-all
              duration-300
              group

              ${
                isCollapsed
                  ? 'justify-center'
                  : ''
              }
            `}
          >

            <LogOut
              className="
                w-5
                h-5
                flex-shrink-0
                group-hover:translate-x-1
                transition-transform
              "
            />

            {!isCollapsed && (

              <span
                className="
                  truncate
                "
              >
                Logout
              </span>

            )}

          </button>

        </div>

        {/* ==================================================
            USER PROFILE
        ================================================== */}

        {!isCollapsed &&
          user && (

            <div
              className="
                p-3
                rounded-xl

                bg-gray-50/80
                dark:bg-slate-800/80

                border
                border-gray-200/50
                dark:border-slate-700/50

                backdrop-blur-md
              "
            >

              <div
                className="
                  flex
                  items-center
                  space-x-3
                "
              >

                <div
                  className="
                    w-10
                    h-10

                    bg-gradient-to-br
                    from-cyan-500
                    to-teal-600

                    rounded-full

                    flex
                    items-center
                    justify-center

                    flex-shrink-0

                    shadow-lg
                  "
                >

                  <span
                    className="
                      text-sm
                      font-bold
                      text-white
                    "
                  >
                    {getInitials()}
                  </span>

                </div>

                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                      dark:text-white
                      truncate
                    "
                  >
                    {user.name ||
                      'User'}
                  </p>

                  <p
                    className="
                      text-xs
                      text-gray-500
                      dark:text-gray-400
                      truncate
                    "
                  >
                    {user.email ||
                      'user@example.com'}
                  </p>

                </div>

              </div>

            </div>

          )}

      </div>

    </div>
  );
};