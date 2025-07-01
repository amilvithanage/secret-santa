export interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateParticipantRequest {
  name: string;
  email: string;
}

export interface UpdateParticipantRequest {
  name?: string;
  email?: string;
}

export interface ParticipantResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
