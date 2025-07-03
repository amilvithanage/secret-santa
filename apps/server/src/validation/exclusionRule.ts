import { z } from 'zod';

export const createExclusionRuleSchema = z.object({
  body: z.object({
    excluderId: z.string().min(1, 'Excluder ID is required'),
    excludedId: z.string().min(1, 'Excluded ID is required'),
    reason: z.string().optional(),
  }).refine(data => data.excluderId !== data.excludedId, {
    message: 'A participant cannot exclude themselves',
    path: ['excludedId']
  })
});

export const getExclusionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    sortBy: z.enum(['createdAt', 'reason']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});

export const exclusionRuleParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Exclusion rule ID is required'),
  })
});

export const giftExchangeParamsSchema = z.object({
  params: z.object({
    giftExchangeId: z.string().min(1, 'Gift exchange ID is required'),
  })
});

export type CreateExclusionRuleInput = z.infer<typeof createExclusionRuleSchema>['body'];
export type GetExclusionsQuery = z.infer<typeof getExclusionsQuerySchema>['query'];
