import { z } from "zod";

export const createParticipantSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters"),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters"),
  }),
});

export const updateParticipantSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .optional(),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters")
      .optional(),
  }),
});

export const participantParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Participant ID is required"),
  }),
});

export const getParticipantsQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
  }),
});

export type CreateParticipantInput = z.infer<
  typeof createParticipantSchema
>["body"];
export type UpdateParticipantInput = z.infer<
  typeof updateParticipantSchema
>["body"];
export type GetParticipantsQuery = z.infer<
  typeof getParticipantsQuerySchema
>["query"];
