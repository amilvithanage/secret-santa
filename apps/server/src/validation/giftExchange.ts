import { z } from "zod";

export const createGiftExchangeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters"),
    year: z
      .number()
      .int()
      .min(2020, "Year must be 2020 or later")
      .max(2030, "Year must be 2030 or earlier"),
  }),
});

export const updateGiftExchangeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .optional(),
    year: z
      .number()
      .int()
      .min(2020, "Year must be 2020 or later")
      .max(2030, "Year must be 2030 or earlier")
      .optional(),
    status: z
      .enum(["DRAFT", "PARTICIPANTS_ADDED", "ASSIGNED", "COMPLETED"])
      .optional(),
  }),
});

export const giftExchangeParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Gift exchange ID is required"),
  }),
});

export const giftExchangeWithParticipantParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Gift exchange ID is required"),
    participantId: z.string().min(1, "Participant ID is required"),
  }),
});

export const addParticipantToExchangeSchema = z.object({
  body: z.object({
    participantId: z.string().min(1, "Participant ID is required"),
  }),
});

export const getGiftExchangesQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    includeParticipants: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    includeAssignments: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  }),
});

export const assignmentParamsSchema = z.object({
  params: z.object({
    giftExchangeId: z.string().min(1, "Gift exchange ID is required"),
    participantId: z.string().min(1, "Participant ID is required").optional(),
  }),
});

export type CreateGiftExchangeInput = z.infer<
  typeof createGiftExchangeSchema
>["body"];
export type UpdateGiftExchangeInput = z.infer<
  typeof updateGiftExchangeSchema
>["body"];
export type AddParticipantToExchangeInput = z.infer<
  typeof addParticipantToExchangeSchema
>["body"];
export type GetGiftExchangesQuery = z.infer<
  typeof getGiftExchangesQuerySchema
>["query"];
