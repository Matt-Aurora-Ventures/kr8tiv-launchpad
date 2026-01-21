'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastMessage: unknown | null;
  send: (data: unknown) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  url,
  reconnect = true,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(reconnect);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus('connected');
        reconnectCountRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch {
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onClose?.();

        // Attempt reconnection
        if (
          shouldReconnectRef.current &&
          reconnectCountRef.current < reconnectAttempts
        ) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setStatus('error');
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
      console.error('WebSocket connection error:', error);
    }
  }, [url, reconnectAttempts, reconnectInterval, onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Initial connection
  useEffect(() => {
    shouldReconnectRef.current = reconnect;
    connect();

    return () => {
      disconnect();
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    lastMessage,
    send,
    connect,
    disconnect,
  };
}

// Token price WebSocket hook
interface TokenPriceUpdate {
  mint: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  timestamp: number;
}

export function useTokenPriceWebSocket(mints: string[]) {
  const [prices, setPrices] = useState<Record<string, TokenPriceUpdate>>({});

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

  const { status, send } = useWebSocket({
    url: `${wsUrl}/prices`,
    onMessage: (data) => {
      const update = data as TokenPriceUpdate;
      if (update.mint) {
        setPrices((prev) => ({
          ...prev,
          [update.mint]: update,
        }));
      }
    },
    onOpen: () => {
      // Subscribe to token prices
      if (mints.length > 0) {
        send({ type: 'subscribe', mints });
      }
    },
  });

  // Update subscriptions when mints change
  useEffect(() => {
    if (status === 'connected' && mints.length > 0) {
      send({ type: 'subscribe', mints });
    }
  }, [mints, status, send]);

  return { prices, status };
}

// Trade feed WebSocket hook
interface TradeUpdate {
  signature: string;
  mint: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  value: number;
  trader: string;
  timestamp: string;
}

export function useTradeWebSocket(mint?: string) {
  const [trades, setTrades] = useState<TradeUpdate[]>([]);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

  useWebSocket({
    url: `${wsUrl}/trades${mint ? `?mint=${mint}` : ''}`,
    onMessage: (data) => {
      const trade = data as TradeUpdate;
      if (trade.signature) {
        setTrades((prev) => [trade, ...prev].slice(0, 100)); // Keep last 100 trades
      }
    },
  });

  return trades;
}

export default useWebSocket;
