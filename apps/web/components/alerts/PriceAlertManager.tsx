'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Button, Input, Select, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface PriceAlert {
  id: string;
  tokenMint: string;
  tokenSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  enabled: boolean;
}

interface PriceAlertContextType {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'enabled'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearTriggered: () => void;
  checkAlerts: (prices: Record<string, number>) => void;
}

const PriceAlertContext = createContext<PriceAlertContextType | null>(null);

export function usePriceAlerts() {
  const context = useContext(PriceAlertContext);
  if (!context) {
    throw new Error('usePriceAlerts must be used within PriceAlertProvider');
  }
  return context;
}

interface PriceAlertProviderProps {
  children: React.ReactNode;
}

export function PriceAlertProvider({ children }: PriceAlertProviderProps) {
  const [alerts, setAlerts] = useLocalStorage<PriceAlert[]>('kr8tiv_price_alerts', []);
  const { toast } = useToast();

  const addAlert = useCallback(
    (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'enabled'>) => {
      const newAlert: PriceAlert = {
        ...alert,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        triggered: false,
        enabled: true,
      };

      setAlerts((prev) => [...prev, newAlert]);

      toast({
        type: 'success',
        title: 'Alert Created',
        message: `Alert set for ${alert.tokenSymbol} ${alert.condition} $${formatNumber(alert.targetPrice, 4)}`,
      });
    },
    [setAlerts, toast]
  );

  const removeAlert = useCallback(
    (id: string) => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [setAlerts]
  );

  const toggleAlert = useCallback(
    (id: string) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
      );
    },
    [setAlerts]
  );

  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.triggered));
  }, [setAlerts]);

  const checkAlerts = useCallback(
    (prices: Record<string, number>) => {
      setAlerts((prev) =>
        prev.map((alert) => {
          if (!alert.enabled || alert.triggered) return alert;

          const currentPrice = prices[alert.tokenMint];
          if (currentPrice === undefined) return alert;

          const isTriggered =
            (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
            (alert.condition === 'below' && currentPrice <= alert.targetPrice);

          if (isTriggered) {
            // Show notification
            toast({
              type: 'info',
              title: 'Price Alert Triggered!',
              message: `${alert.tokenSymbol} is now ${alert.condition} $${formatNumber(alert.targetPrice, 4)}`,
            });

            // Try to show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('KR8TIV Price Alert', {
                body: `${alert.tokenSymbol} is now ${alert.condition} $${formatNumber(alert.targetPrice, 4)}`,
                icon: '/icon.png',
              });
            }

            return {
              ...alert,
              triggered: true,
              triggeredAt: new Date().toISOString(),
            };
          }

          return alert;
        })
      );
    },
    [setAlerts, toast]
  );

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <PriceAlertContext.Provider
      value={{
        alerts,
        addAlert,
        removeAlert,
        toggleAlert,
        clearTriggered,
        checkAlerts,
      }}
    >
      {children}
    </PriceAlertContext.Provider>
  );
}

// Alert List Component
interface AlertListProps {
  tokenMint?: string; // Filter by token
  className?: string;
}

export function AlertList({ tokenMint, className }: AlertListProps) {
  const { alerts, removeAlert, toggleAlert, clearTriggered } = usePriceAlerts();

  const filteredAlerts = tokenMint
    ? alerts.filter((a) => a.tokenMint === tokenMint)
    : alerts;

  const activeAlerts = filteredAlerts.filter((a) => !a.triggered);
  const triggeredAlerts = filteredAlerts.filter((a) => a.triggered);

  if (filteredAlerts.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No price alerts set</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Active Alerts</h4>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onToggle={() => toggleAlert(alert.id)}
                onRemove={() => removeAlert(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Triggered</h4>
            <button
              onClick={clearTriggered}
              className="text-xs text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onRemove={() => removeAlert(alert.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Single Alert Item
interface AlertItemProps {
  alert: PriceAlert;
  onToggle?: () => void;
  onRemove: () => void;
}

function AlertItem({ alert, onToggle, onRemove }: AlertItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all',
        alert.triggered
          ? 'bg-green-500/10 border-green-500/20'
          : alert.enabled
            ? 'bg-secondary/50 border-border'
            : 'bg-secondary/20 border-border opacity-60'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            alert.condition === 'above'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          )}
        >
          {alert.condition === 'above' ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {alert.tokenSymbol}{' '}
            <span className="text-muted-foreground">
              {alert.condition === 'above' ? '≥' : '≤'}
            </span>{' '}
            ${formatNumber(alert.targetPrice, 4)}
          </p>
          <p className="text-xs text-muted-foreground">
            {alert.triggered
              ? `Triggered ${new Date(alert.triggeredAt!).toLocaleString()}`
              : `Created ${new Date(alert.createdAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {alert.triggered && <Check className="h-4 w-4 text-green-500" />}
        {!alert.triggered && onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            {alert.enabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Create Alert Modal
interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenMint: string;
  tokenSymbol: string;
  currentPrice: number;
}

export function CreateAlertModal({
  isOpen,
  onClose,
  tokenMint,
  tokenSymbol,
  currentPrice,
}: CreateAlertModalProps) {
  const { addAlert } = usePriceAlerts();
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    addAlert({
      tokenMint,
      tokenSymbol,
      targetPrice: price,
      condition,
    });

    setTargetPrice('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Price Alert" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="text-lg font-bold">${formatNumber(currentPrice, 4)}</p>
        </div>

        <Select
          label="Condition"
          value={condition}
          onChange={(v) => setCondition(v as 'above' | 'below')}
          options={[
            { value: 'above', label: 'Price goes above' },
            { value: 'below', label: 'Price goes below' },
          ]}
        />

        <Input
          label="Target Price"
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="0.00"
          step="any"
          min="0"
          required
          hint={`Alert when ${tokenSymbol} ${condition === 'above' ? 'rises above' : 'falls below'} this price`}
        />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Bell className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Quick Alert Button
interface QuickAlertButtonProps {
  tokenMint: string;
  tokenSymbol: string;
  currentPrice: number;
  className?: string;
}

export function QuickAlertButton({
  tokenMint,
  tokenSymbol,
  currentPrice,
  className,
}: QuickAlertButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'p-2 rounded-lg hover:bg-secondary transition-colors',
          className
        )}
        title="Set price alert"
      >
        <Bell className="h-4 w-4" />
      </button>

      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokenMint={tokenMint}
        tokenSymbol={tokenSymbol}
        currentPrice={currentPrice}
      />
    </>
  );
}

export default PriceAlertProvider;
