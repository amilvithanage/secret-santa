import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import type {
  Participant,
  GiftExchange,
  ExclusionRule,
  Assignment,
  CreateParticipantRequest,
  CreateGiftExchangeRequest,
  CreateExclusionRuleRequest,
} from "../types/api";

// Generic hook for API state management
export function useApiState<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe setData wrapper that ensures arrays stay arrays
  const safeSetData = useCallback((newData: T | ((prev: T) => T)) => {
    if (typeof newData === 'function') {
      setData((prev) => {
        // If initial data was an array, ensure prev is always an array
        if (Array.isArray(initialData) && !Array.isArray(prev)) {
          return (newData as (prev: T) => T)(initialData);
        }
        return (newData as (prev: T) => T)(prev);
      });
    } else {
      setData(newData);
    }
  }, []); // Remove initialData dependency to prevent recreation

  const execute = useCallback(async (apiCall: () => Promise<any>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      if (response.success) {
        safeSetData(response.data);
        return response.data;
      } else {
        setError(response.error || "An error occurred");
        return null;
      }
    } catch (err) {
      setError("Network error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData: safeSetData, setError };
}

// Participants hook
export function useParticipants() {
  const { data, loading, error, execute, setData, setError } = useApiState<Participant[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadParticipants = useCallback(
    async (page = 1, limit = 50) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.getParticipants(page, limit);
        if (response.success) {
          const participantsArray = response.data?.data || [];
          setData(participantsArray);
          return participantsArray;
        } else {
          setError(response.error || "Failed to load participants");
          return [];
        }
      } catch (err) {
        setError("Network error occurred");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [], // State setters are stable, no dependencies needed
  );

  const createParticipant = useCallback(
    async (participantData: CreateParticipantRequest) => {
      try {
        const response = await apiService.createParticipant(participantData);
        if (response.success && response.data) {
          // Add to existing data - ensure prev is always an array
          setData((prev) => {
            const currentArray = Array.isArray(prev) ? prev : [];
            return [...currentArray, response.data];
          });
          return response.data;
        } else {
          setError(response.error || "Failed to create participant");
          return null;
        }
      } catch (err) {
        setError("Network error occurred");
        return null;
      }
    },
    [], // State setters are stable, no dependencies needed
  );

  return {
    participants: data,
    loading: loading || isLoading,
    error,
    loadParticipants,
    createParticipant,
  };
}

// Gift Exchanges hook
export function useGiftExchanges() {
  const { data, loading, error, execute, setData, setError } = useApiState<
    GiftExchange[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGiftExchanges = useCallback(
    async (page = 1, limit = 50) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.getGiftExchanges(page, limit);
        if (response.success) {
          const exchangesArray = response.data?.data || [];
          setData(exchangesArray);
          return exchangesArray;
        } else {
          setError(response.error || "Failed to load gift exchanges");
          return [];
        }
      } catch (err) {
        setError("Network error occurred");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [], // State setters are stable, no dependencies needed
  );

  const createGiftExchange = useCallback(
    async (exchangeData: CreateGiftExchangeRequest) => {
      try {
        const response = await apiService.createGiftExchange(exchangeData);
        if (response.success && response.data) {
          // Add to existing data - ensure prev is always an array
          setData((prev) => {
            const currentArray = Array.isArray(prev) ? prev : [];
            return [...currentArray, response.data];
          });
          return response.data;
        } else {
          setError(response.error || "Failed to create gift exchange");
          return null;
        }
      } catch (err) {
        setError("Network error occurred");
        return null;
      }
    },
    [], // State setters are stable, no dependencies needed
  );

  return {
    giftExchanges: data,
    loading: loading || isLoading,
    error,
    loadGiftExchanges,
    createGiftExchange,
  };
}

// Exchange participants hook
export function useExchangeParticipants(exchangeId: string | null) {
  const { data, loading, error, execute, setData, setError } = useApiState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadExchangeParticipants = useCallback(async () => {
    if (!exchangeId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getExchangeParticipants(exchangeId);
      if (response.success) {
        const participantsArray = response.data || [];
        setData(participantsArray);
        return participantsArray;
      } else {
        setError(response.error || "Failed to load exchange participants");
        return [];
      }
    } catch (err) {
      setError("Network error occurred");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [exchangeId]); // Only exchangeId needed, state setters are stable

  const addParticipantToExchange = useCallback(
    async (participantId: string) => {
      if (!exchangeId) return null;
      try {
        const result = await execute(() =>
          apiService.addParticipantToExchange(exchangeId, { participantId }),
        );
        if (result) {
          // Reload participants by calling the API directly
          loadExchangeParticipants().catch(console.error);
        }
        return result;
      } catch (error) {
        console.error("Error adding participant to exchange:", error);
        return null;
      }
    },
    [exchangeId, execute], // Remove loadExchangeParticipants dependency
  );

  useEffect(() => {
    if (exchangeId) {
      loadExchangeParticipants().catch(console.error);
    }
  }, [exchangeId]); // Only depend on exchangeId, not the function

  return {
    exchangeParticipants: data,
    loading: loading || isLoading,
    error,
    loadExchangeParticipants,
    addParticipantToExchange,
  };
}

// Exclusion rules hook
export function useExclusionRules(exchangeId: string | null) {
  const { data, loading, error, execute, setData, setError } = useApiState<
    ExclusionRule[]
  >([]);

  const createExclusionRule = useCallback(
    async (ruleData: CreateExclusionRuleRequest) => {
      if (!exchangeId) return null;
      try {
        const response = await apiService.createExclusionRule(exchangeId, ruleData);
        if (response.success && response.data) {
          // Add to existing data - ensure prev is always an array
          setData((prev) => {
            const currentArray = Array.isArray(prev) ? prev : [];
            return [...currentArray, response.data];
          });
          return response.data;
        } else {
          const errorMessage = response.error || "Failed to create exclusion rule";
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        const errorMessage = err.message || "Network error occurred";
        setError(errorMessage);
        throw err;
      }
    },
    [exchangeId], // Only exchangeId needed, state setters are stable
  );

  const validateExclusionRules = useCallback(async () => {
    if (!exchangeId) return null;
    return await execute(() => apiService.validateExclusionRules(exchangeId));
  }, [exchangeId, execute]);

  return {
    exclusionRules: data,
    loading,
    error,
    createExclusionRule,
    validateExclusionRules,
  };
}

// Assignments hook
export function useAssignments(exchangeId: string | null) {
  const { data, loading, error, execute } = useApiState<Assignment[]>([]);

  const loadAssignments = useCallback(async () => {
    if (!exchangeId) return [];
    return await execute(() =>
      apiService.getAssignmentsForExchange(exchangeId),
    );
  }, [exchangeId, execute]);

  const createAssignments = useCallback(async () => {
    if (!exchangeId) return null;
    try {
      const result = await execute(() =>
        apiService.createAssignments(exchangeId),
      );
      // The execute function already calls setData with response.data
      // So we don't need to call setData again here
      return result;
    } catch (error) {
      console.error("Error creating assignments:", error);
      return null;
    }
  }, [exchangeId, execute]);

  useEffect(() => {
    if (exchangeId) {
      loadAssignments().catch(console.error);
    }
  }, [exchangeId]); // Only depend on exchangeId, not the function

  return {
    assignments: data,
    loading,
    error,
    loadAssignments,
    createAssignments,
  };
}
