import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const currencies: Currency[] = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳'
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸'
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺'
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧'
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵'
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦'
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺'
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    flag: '🇨🇭'
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳'
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷'
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷'
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬'
  }
];

interface CurrencySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  isOpen,
  onClose,
  currentCurrency,
  onCurrencyChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] =
    useState<Currency>(currentCurrency);

  useEffect(() => {
    setSelectedCurrency(currentCurrency);
  }, [currentCurrency]);

  const filteredCurrencies = currencies.filter((currency) =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onCurrencyChange(selectedCurrency);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="w-full max-w-md transform transition-all duration-300 animate-in slide-in-from-bottom-4">
        <Card className="max-h-[80vh] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Select Currency
              </h2>

              <p className="text-gray-600 dark:text-gray-300">
                Choose your preferred currency
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full
                px-4
                py-2
                border
                border-gray-300/50
                dark:border-slate-600/50
                rounded-xl
                bg-white/50
                dark:bg-slate-800/50
                backdrop-blur-md
                text-gray-900
                dark:text-white
                focus:ring-2
                focus:ring-cyan-500/50
                focus:border-cyan-500/50
              "
            />
          </div>

          {/* Currency List */}
          <div className="max-h-80 overflow-y-auto space-y-2 mb-6">

            {filteredCurrencies.length > 0 ? (

              filteredCurrencies.map((currency) => (

                <button
                  key={currency.code}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-between
                    p-3
                    rounded-xl
                    transition-all
                    duration-300

                    ${
                      selectedCurrency.code === currency.code
                        ? `
                          bg-cyan-50
                          dark:bg-cyan-500/20
                          border
                          border-cyan-200
                          dark:border-cyan-500/30
                          text-cyan-600
                          dark:text-cyan-400
                        `
                        : `
                          hover:bg-gray-50
                          dark:hover:bg-slate-800/50
                          text-gray-900
                          dark:text-white
                        `
                    }
                  `}
                >

                  <div className="flex items-center space-x-3">

                    <span className="text-2xl">
                      {currency.flag}
                    </span>

                    <div className="text-left">

                      <p className="font-medium">
                        {currency.name}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currency.code}
                      </p>

                    </div>

                  </div>

                  <span className="text-lg font-bold">
                    {currency.symbol}
                  </span>

                </button>

              ))

            ) : (

              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No currencies found
              </div>

            )}

          </div>

          {/* Actions */}
          <div className="flex space-x-3">

            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              className="flex-1"
            >
              Save Currency
            </Button>

          </div>

        </Card>
      </div>
    </div>
  );
};


/* =========================================================
   CURRENCY HOOK
   ========================================================= */

export const useCurrency = () => {

  /*
   * INR is now the default currency.
   */
  const defaultCurrency: Currency = currencies[0];

  const [currency, setCurrency] =
    useState<Currency>(defaultCurrency);


  /* =======================================================
     LOAD SAVED CURRENCY
     ======================================================= */

  useEffect(() => {

    const savedCurrency =
      localStorage.getItem('selectedCurrency');

    if (savedCurrency) {

      try {

        const parsed: Currency =
          JSON.parse(savedCurrency);

        /*
         * Make sure the saved currency is still valid.
         */
        const validCurrency =
          currencies.find(
            (item) => item.code === parsed.code
          );

        if (validCurrency) {

          setCurrency(validCurrency);

        } else {

          /*
           * Invalid/old value -> INR
           */
          setCurrency(defaultCurrency);

          localStorage.setItem(
            'selectedCurrency',
            JSON.stringify(defaultCurrency)
          );
        }

      } catch (error) {

        console.error(
          'Error parsing saved currency:',
          error
        );

        setCurrency(defaultCurrency);

        localStorage.setItem(
          'selectedCurrency',
          JSON.stringify(defaultCurrency)
        );
      }

    } else {

      /*
       * No saved currency -> INR
       */
      setCurrency(defaultCurrency);

      localStorage.setItem(
        'selectedCurrency',
        JSON.stringify(defaultCurrency)
      );

    }

  }, []);


  /* =======================================================
     UPDATE CURRENCY
     ======================================================= */

  const updateCurrency = (newCurrency: Currency) => {

    setCurrency(newCurrency);

    localStorage.setItem(
      'selectedCurrency',
      JSON.stringify(newCurrency)
    );

  };


  /* =======================================================
     FORMAT AMOUNT
     ======================================================= */

  const formatAmount = (amount: number) => {

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

  };


  return {
    currency,
    updateCurrency,
    formatAmount,
    currencySymbol: currency.symbol
  };

};