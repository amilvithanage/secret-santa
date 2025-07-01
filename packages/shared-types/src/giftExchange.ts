export enum GiftExchangeStatus {
  DRAFT = 'DRAFT',
  PARTICIPANTS_ADDED = 'PARTICIPANTS_ADDED',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED'
}

export interface GiftExchange {
  id: string;
  name: string;
  year: number;
  status: GiftExchangeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGiftExchangeRequest {
  name: string;
  year: number;
}

export interface UpdateGiftExchangeRequest {
  name?: string;
  year?: number;
  status?: GiftExchangeStatus;
}

export interface GiftExchangeResponse {
  id: string;
  name: string;
  year: number;
  status: GiftExchangeStatus;
  createdAt: string;
  updatedAt: string;
  participants?: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }>;
  assignments?: Array<{
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
  }>;
}

export interface GiftExchangeParticipant {
  id: string;
  giftExchangeId: string;
  participantId: string;
  createdAt: Date;
}

export interface AddParticipantToExchangeRequest {
  participantId: string;
}
