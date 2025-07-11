# @secret-santa/shared-types

Shared TypeScript types and interfaces for the Secret Santa application.

## Overview

This package contains all the shared TypeScript interfaces and types used across both the frontend (React) and backend (Node.js/Express) applications in the Secret Santa monorepo.

## Installation

This package is automatically installed when you run `npm install` from the root of the monorepo due to the workspace configuration.

## Usage

```typescript
import {
  Participant,
  CreateParticipantRequest,
  GiftExchange,
  GiftExchangeStatus,
  Assignment,
  ExclusionRule,
  ApiResponse,
} from "@secret-santa/shared-types";
```

## Types Included

### Participant Types

- `Participant` - Core participant interface
- `CreateParticipantRequest` - Request payload for creating participants
- `UpdateParticipantRequest` - Request payload for updating participants
- `ParticipantResponse` - API response format for participants

### Gift Exchange Types

- `GiftExchange` - Core gift exchange interface
- `GiftExchangeStatus` - Enum for exchange statuses (DRAFT, PARTICIPANTS_ADDED, ASSIGNED, COMPLETED)
- `CreateGiftExchangeRequest` - Request payload for creating exchanges
- `UpdateGiftExchangeRequest` - Request payload for updating exchanges
- `GiftExchangeResponse` - API response format for exchanges
- `GiftExchangeParticipant` - Junction table interface
- `AddParticipantToExchangeRequest` - Request payload for adding participants

### Assignment Types

- `Assignment` - Core assignment interface
- `AssignmentResponse` - API response format for assignments
- `CreateAssignmentsRequest` - Request payload for creating assignments
- `AssignmentResult` - Result of assignment algorithm

### Exclusion Rule Types

- `ExclusionRule` - Core exclusion rule interface
- `CreateExclusionRuleRequest` - Request payload for creating exclusion rules
- `ExclusionRuleResponse` - API response format for exclusion rules

### API Types

- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated API response wrapper
- `ApiError` - Error response format
- `PaginationParams` - Query parameters for pagination
- `SortParams` - Query parameters for sorting

## Development

### Building

```bash
npm run build
```

### Development Mode (Watch)

```bash
npm run dev
```

### Testing

```bash
npm run test
```

### Cleaning

```bash
npm run clean
```

## Architecture Notes

- All interfaces use string IDs (generated by Prisma as cuid)
- Dates are represented as `Date` objects in core interfaces and as ISO strings in response interfaces
- Request interfaces only include the fields that can be set by the client
- Response interfaces include computed/relational data
- Enums are used for status fields to ensure type safety
