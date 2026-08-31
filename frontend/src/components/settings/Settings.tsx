import React, { useState } from 'react';
import {
  Globe,
  Moon,
  User,
  Save,
  CheckCircle
} from 'lucide-react';

import {
  CurrencySelector,
  useCurrency
} from './CurrencySelector';

import { ThemeToggle } from '../ui/ThemeToggle';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const SettingsPage: React.FC = () => {

  const {
    currency
  } = useCurrency();

  const [
    isCurrencyOpen,
    setIsCurrencyOpen
  ] = useState(false);

  const [
    saved,
    setSaved
  ] = useState(false);

  const user = (() => {
    try {
      const data =
        localStorage.getItem('user');

      return data
        ? JSON.parse(data)
        : null;

    } catch {
      return null;
    }
  })();

  const handleSaved = () => {

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);

  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}

      <div>

        <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-1">
          Preferences
        </p>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>

        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your account and application preferences.
        </p>

      </div>

      {/* Account */}

      <Card>

        <div className="p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">

              <User className="w-5 h-5 text-cyan-500" />

            </div>

            <div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Account
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your FinTrack account information
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/70">

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Name
              </p>

              <p className="font-medium text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </p>

            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/70">

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Email
              </p>

              <p className="font-medium text-gray-900 dark:text-white break-all">
                {user?.email || 'Not available'}
              </p>

            </div>

          </div>

        </div>

      </Card>

      {/* Currency */}

      <Card>

        <div className="p-6">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">

                <Globe className="w-5 h-5 text-cyan-500" />

              </div>

              <div>

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Currency
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select the currency used throughout FinTrack.
                </p>

              </div>

            </div>

            <Button
              onClick={() =>
                setIsCurrencyOpen(true)
              }
            >
              {currency.flag} {currency.code}
            </Button>

          </div>

          <div className="mt-5 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/70">

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current currency
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {currency.symbol} {currency.name}
            </p>

          </div>

        </div>

      </Card>

      {/* Appearance */}

      <Card>

        <div className="p-6">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">

              <Moon className="w-5 h-5 text-cyan-500" />

            </div>

            <div>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Appearance
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose how FinTrack looks.
              </p>

            </div>

          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-800/70">

            <div>

              <p className="font-medium text-gray-900 dark:text-white">
                Dark Mode
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch between light and dark themes.
              </p>

            </div>

            <ThemeToggle />

          </div>

        </div>

      </Card>

      {/* Save */}

      <div className="flex justify-end">

        <Button
          onClick={handleSaved}
          className="flex items-center gap-2"
        >

          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}

        </Button>

      </div>

      {/* Currency Modal */}

      <CurrencySelector
        isOpen={isCurrencyOpen}
        onClose={() =>
          setIsCurrencyOpen(false)
        }
        currentCurrency={currency}
        onCurrencyChange={() => {
          setIsCurrencyOpen(false);
        }}
      />

    </div>
  );
};