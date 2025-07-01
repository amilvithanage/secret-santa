export interface Assignment {
  id: string;
  giftExchangeId: string;
  giverId: string;
  receiverId: string;
  createdAt: Date;
}

export interface AssignmentResponse {
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

export interface CreateAssignmentsRequest {
  giftExchangeId: string;
}

export interface AssignmentResult {
  success: boolean;
  assignments?: AssignmentResponse[];
  error?: string;
}
