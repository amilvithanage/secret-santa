import type {
  ApiResponse,
  PaginatedResponse,
  Participant,
  GiftExchange,
  ExclusionRule,
  Assignment,
  ValidationResult,
  CreateParticipantRequest,
  CreateGiftExchangeRequest,
  CreateExclusionRuleRequest,
  AddParticipantToExchangeRequest,
} from "../types/api";

const API_BASE_URL = "http://localhost:3000/api/v1";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle the double nesting issue we found in testing
      if (data.data && data.data.data) {
        return {
          ...data,
          data: data.data.data,
        };
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  // Participants API
  async getParticipants(
    page = 1,
    limit = 10,
  ): Promise<ApiResponse<PaginatedResponse<Participant>>> {
    return this.request(`/participants?page=${page}&limit=${limit}`);
  }

  async createParticipant(
    data: CreateParticipantRequest,
  ): Promise<ApiResponse<Participant>> {
    return this.request("/participants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getParticipantById(id: string): Promise<ApiResponse<Participant>> {
    return this.request(`/participants/${id}`);
  }

  // Gift Exchanges API
  async getGiftExchanges(
    page = 1,
    limit = 10,
  ): Promise<ApiResponse<PaginatedResponse<GiftExchange>>> {
    return this.request(`/gift-exchanges?page=${page}&limit=${limit}`);
  }

  async createGiftExchange(
    data: CreateGiftExchangeRequest,
  ): Promise<ApiResponse<GiftExchange>> {
    return this.request("/gift-exchanges", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getGiftExchangeById(id: string): Promise<ApiResponse<GiftExchange>> {
    return this.request(`/gift-exchanges/${id}`);
  }

  async addParticipantToExchange(
    exchangeId: string,
    data: AddParticipantToExchangeRequest,
  ): Promise<ApiResponse<void>> {
    return this.request(`/gift-exchanges/${exchangeId}/participants`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getExchangeParticipants(
    _exchangeId: string,
  ): Promise<ApiResponse<Participant[]>> {
    // This endpoint might not exist on the server yet, so return empty for now
    return {
      success: true,
      data: [],
    };
  }

  // Exclusion Rules API
  async createExclusionRule(
    exchangeId: string,
    data: CreateExclusionRuleRequest,
  ): Promise<ApiResponse<ExclusionRule>> {
    return this.request(`/exclusion-rules/${exchangeId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async validateExclusionRules(
    exchangeId: string,
  ): Promise<ApiResponse<ValidationResult>> {
    return this.request(`/exclusion-rules/${exchangeId}/validate`);
  }

  // Assignments API
  async getAssignments(): Promise<ApiResponse<Assignment[]>> {
    return this.request("/assignments");
  }

  async getAssignmentsForExchange(
    exchangeId: string,
  ): Promise<ApiResponse<Assignment[]>> {
    return this.request(`/gift-exchanges/${exchangeId}/assignments`);
  }

  async createAssignments(
    exchangeId: string,
  ): Promise<ApiResponse<Assignment[]>> {
    return this.request(`/gift-exchanges/${exchangeId}/assignments`, {
      method: "POST",
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      const url = "http://localhost:3000/api/health";
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: "Health check failed",
      };
    }
  }
}

export const apiService = new ApiService();
