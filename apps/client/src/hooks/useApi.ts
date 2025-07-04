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

  const execute = useCallback(async (apiCall: () => Promise<any>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      if (response.success) {
        setData(response.data);
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

  return { data, loading, error, execute, setData, setError };
}

// Participants hook
export function useParticipants() {
  const { data, loading, error, execute, setData } = useApiState<Participant[]>(
    [],
  );

  const loadParticipants = useCallback(
    async (page = 1, limit = 50) => {
      const result = await execute(() =>
        apiService.getParticipants(page, limit),
      );
      return result?.data || [];
    },
    [execute],
  );

  const createParticipant = useCallback(
    async (participantData: CreateParticipantRequest) => {
      const result = await execute(() =>
        apiService.createParticipant(participantData),
      );
      if (result) {
        // Add to existing data
        setData((prev) => [...prev, result]);
      }
      return result;
    },
    [execute],
  );

  return {
    participants: data,
    loading,
    error,
    loadParticipants,
    createParticipant,
  };
}

// Gift Exchanges hook
export function useGiftExchanges() {
  const { data, loading, error, execute, setData } = useApiState<
    GiftExchange[]
  >([]);

  const loadGiftExchanges = useCallback(
    async (page = 1, limit = 50) => {
      const result = await execute(() =>
        apiService.getGiftExchanges(page, limit),
      );
      return result?.data || [];
    },
    [execute],
  );

  const createGiftExchange = useCallback(
    async (exchangeData: CreateGiftExchangeRequest) => {
      const result = await execute(() =>
        apiService.createGiftExchange(exchangeData),
      );
      if (result) {
        setData((prev) => [...prev, result]);
      }
      return result;
    },
    [execute],
  );

  return {
    giftExchanges: data,
    loading,
    error,
    loadGiftExchanges,
    createGiftExchange,
  };
}

// Exchange participants hook
export function useExchangeParticipants(exchangeId: string | null) {
  const { data, loading, error, execute } = useApiState<Participant[]>([]);

  const loadExchangeParticipants = useCallback(async () => {
    if (!exchangeId) return [];
    try {
      return await execute(() =>
        apiService.getExchangeParticipants(exchangeId),
      );
    } catch (error) {
      console.error("Error loading exchange participants:", error);
      return [];
    }
  }, [exchangeId, execute]);

  const addParticipantToExchange = useCallback(
    async (participantId: string) => {
      if (!exchangeId) return null;
      try {
        const result = await execute(() =>
          apiService.addParticipantToExchange(exchangeId, { participantId }),
        );
        if (result) {
          // Reload participants
          await loadExchangeParticipants();
        }
        return result;
      } catch (error) {
        console.error("Error adding participant to exchange:", error);
        return null;
      }
    },
    [exchangeId, execute, loadExchangeParticipants],
  );

  useEffect(() => {
    if (exchangeId) {
      loadExchangeParticipants().catch(console.error);
    }
  }, [exchangeId, loadExchangeParticipants]);

  return {
    exchangeParticipants: data,
    loading,
    error,
    loadExchangeParticipants,
    addParticipantToExchange,
  };
}

// Exclusion rules hook
export function useExclusionRules(exchangeId: string | null) {
  const { data, loading, error, execute, setData } = useApiState<
    ExclusionRule[]
  >([]);

  const createExclusionRule = useCallback(
    async (ruleData: CreateExclusionRuleRequest) => {
      if (!exchangeId) return null;
      const result = await execute(() =>
        apiService.createExclusionRule(exchangeId, ruleData),
      );
      if (result) {
        setData((prev) => [...prev, result]);
      }
      return result;
    },
    [exchangeId, execute],
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
  }, [exchangeId, loadAssignments]);

  return {
    assignments: data,
    loading,
    error,
    loadAssignments,
    createAssignments,
  };
}
