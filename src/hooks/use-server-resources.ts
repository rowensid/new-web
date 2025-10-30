'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerStats } from '@/lib/pterodactyl';

interface UseServerResourcesOptions {
  serverId: string;
  enabled?: boolean;
  updateInterval?: number;
}

interface ServerResourcesState {
  data: ServerStats | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: string | null;
}

export function useServerResources({ 
  serverId, 
  enabled = true, 
  updateInterval = 5000 
}: UseServerResourcesOptions) {
  const [state, setState] = useState<ServerResourcesState>({
    data: null,
    isLoading: true,
    error: null,
    isConnected: false,
    lastUpdate: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (socketRef.current?.connected) return;

    console.log('Connecting to WebSocket for server resources...');
    
    socketRef.current = io({
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected for server resources');
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      reconnectAttempts.current = 0;

      // Subscribe to server resources
      socket.emit('subscribe-server-resources', { serverId });
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState(prev => ({ ...prev, isConnected: false }));

      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to real-time monitoring',
        isConnected: false 
      }));
    });

    // Handle server resource updates
    socket.on('server-resources-update', (data: { 
      serverId: string; 
      data: ServerStats; 
      timestamp: string; 
    }) => {
      if (data.serverId === serverId) {
        setState(prev => ({
          ...prev,
          data: data.data,
          isLoading: false,
          error: null,
          lastUpdate: data.timestamp,
        }));
      }
    });

    // Handle resource errors
    socket.on('server-resources-error', (data: { 
      serverId: string; 
      error: string; 
      timestamp: string; 
    }) => {
      if (data.serverId === serverId) {
        setState(prev => ({
          ...prev,
          error: data.error,
          isLoading: false,
        }));
      }
    });

    // Handle subscription confirmation
    socket.on('subscribed-to-server-resources', (data: { serverId: string }) => {
      if (data.serverId === serverId) {
        console.log(`Successfully subscribed to server ${serverId} resources`);
      }
    });

    socket.on('unsubscribed-from-server-resources', (data: { serverId: string }) => {
      if (data.serverId === serverId) {
        console.log(`Unsubscribed from server ${serverId} resources`);
      }
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket...');
      
      // Unsubscribe from server resources
      socketRef.current.emit('unsubscribe-server-resources', { serverId });
      
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isConnected: false,
      data: null,
      isLoading: true,
      error: null,
      lastUpdate: null,
    }));
  };

  useEffect(() => {
    if (!enabled || !serverId) {
      disconnect();
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [serverId, enabled]);

  // Manual reconnect function
  const reconnect = () => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 1000);
  };

  return {
    ...state,
    reconnect,
    disconnect,
    connect,
  };
}