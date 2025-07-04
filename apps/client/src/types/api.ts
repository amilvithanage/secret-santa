// API Types for Secret Santa Client
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftExchange {
  id: string;
  name: string;
  year: number;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExclusionRule {
  id: string;
  giftExchangeId: string;
  excluder: {
    id: string;
    name: string;
    email: string;
  };
  excluded: {
    id: string;
    name: string;
    email: string;
  };
  reason?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  giftExchangeId: string;
  giver: {
    id: string;
    name: string;
    email: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

// Request types
export interface CreateParticipantRequest {
  name: string;
  email: string;
}

export interface CreateGiftExchangeRequest {
  name: string;
  year: number;
  description?: string;
}

export interface CreateExclusionRuleRequest {
  excluderId: string;
  excludedId: string;
  reason?: string;
}

export interface AddParticipantToExchangeRequest {
  participantId: string;
}
