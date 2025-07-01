export interface ExclusionRule {
  id: string;
  giftExchangeId: string;
  excluderId: string;
  excludedId: string;
  reason?: string;
  createdAt: Date;
}

export interface CreateExclusionRuleRequest {
  giftExchangeId: string;
  excluderId: string;
  excludedId: string;
  reason?: string;
}

export interface ExclusionRuleResponse {
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
