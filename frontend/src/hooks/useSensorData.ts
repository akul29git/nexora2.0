import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ApiError } from '../services/api';

const QUERY_KEYS = {
  sensorData: ['sensorData'] as const,
  health: ['health'] as const,
};

export function useSensorData(pollInterval = 2000) {
  return useQuery({
    queryKey: QUERY_KEYS.sensorData,
    queryFn: api.getSensorData,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
    staleTime: 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useHealth(pollInterval = 5000) {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: api.getHealth,
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true,
    staleTime: 2000,
    retry: 3,
  });
}

export function usePostSensorData(apiKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: unknown) => api.postSensorData(payload, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sensorData });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.health });
    },
    onError: (error: ApiError) => {
      console.error('Failed to post sensor data:', error);
    },
  });
}

export function useConnectionStatus() {
  const { data: health, isLoading } = useHealth();
  const { data: sensorData, isLoading: sensorLoading } = useSensorData();

  if (isLoading || sensorLoading) {
    return { status: 'loading' as const, health: null, sensorData: null };
  }

  if (!health) {
    return { status: 'error' as const, health: null, sensorData: null };
  }

  return {
    status: health.status,
    health,
    sensorData,
    isConnected: health.connected,
    lastContact: health.lastEsp32Contact,
    ageMs: sensorData?.ageMs ?? health.ageMs,
  };
}