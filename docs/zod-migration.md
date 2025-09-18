# Zod Migration Report

| Legacy Type/Class | Replacement Schema | Additional Validation | Potential Breaking Changes |
| --- | --- | --- | --- |
| `SEOConfig` | `seoConfigSchema` (`src/schemas/seo.ts`) | Enforces trimmed titles/descriptions, keyword length, HTTPS or root-relative artwork, deduplicates keywords | Fails if title/description are under 3 chars or keywords exceed 25 entries |
| `AnalyticsEvent` | `analyticsEventSchema` (`src/schemas/analytics.ts`) | Caps property count, enforces trimmed event names | Events with more than 50 properties now rejected |
| `AnalyticsUser` | `analyticsUserSchema` (`src/schemas/analytics.ts`) | Requires UUID-style IDs, lowercases email, allows passthrough metadata | Invalid or placeholder IDs now rejected |
| `User` (`src/types`) | `userSchema` (`src/schemas/core/index.ts`) | Coerces `createdAt`/`updatedAt` to `Date`, enforces role enum | Non-date timestamps throw during hydration |
| `AuthState` (`src/types`) | `coreAuthStateSchema` (`src/schemas/core/index.ts`) | Strict boolean validation | None |
| `ApiResponse<T>` | `createApiResponseSchema` (`src/schemas/core/index.ts`) | Validates error array message length, success flag, optional ISO timestamp | Responses missing valid error messages still reject; timestamp is optional |
| Pagination query params | `paginationParamsSchema` (`src/schemas/common/primitives.ts`) | Coerces query args to integers, bounds page/pageSize | Requests with non-numeric or out-of-range pagination now rejected |
| `PipelineStep` | `pipelineStepSchema` (`src/schemas/core/index.ts`) | Validates slugs, description length, status enum | Invalid icon identifiers or overlong descriptions rejected |
| `RouteConfig` | `routeConfigSchema` (`src/schemas/core/index.ts`) | Verifies component factory is callable, trims metadata | Attempting to register non-component objects now throws |
| `NotificationFrequency` and related account settings interfaces | Account schemas (`src/schemas/account/accountSettings.ts`) | Normalises phone numbers, enforces HTTPS webhooks, validates 24h quiet hours window, trims webhook descriptions, login history caps | Invalid phone/webhook URLs or matching quiet-hour bounds raise validation errors |
| `AccountSettingsUpdate` | `accountSettingsUpdateSchema` (`src/schemas/account/accountSettings.ts`) | Nested partial validation for update payloads | Update calls with extraneous keys now rejected |
| `Auth` module types (`User`, `AuthState`, `AuthContextType`, `PasswordStrength`, `FormErrors`) | Auth schemas (`src/schemas/auth/auth.ts`) | Adds password feedback bounds, trims error strings, enforces UUID user id | Custom auth consumers must satisfy stricter function signatures |
| Env helpers | `envSchema`/`buildEnv` (`src/schemas/env.ts`) | Validates HTTPS Supabase URL, minimum key length, rejects placeholder values | Project will fail fast if `.env` still contains placeholder strings |
| `createDefaultAccountSettings` | Returns validated schema result (`src/schemas/account/accountSettings.ts`) | Normalizes overrides, timestamps, webhook arrays | Missing `userId` overrides now default to validated placeholders |
| Password utilities | `passwordStrengthSchema` (`src/schemas/auth/auth.ts`) | Ensures computed feedback fits score contract | Custom password checks must respect score 0-5 range |

## Integration Notes

- All runtime entry points (`updateSEO`, analytics helpers, env loader, Supabase account settings service) now parse inputs through their corresponding schemas before continuing. Catch and surface `ZodError` where user messaging is required.
- Account settings service now rejects malformed Supabase rows and will reseed through validated defaults when rows are missing. Section updates call their dedicated schema to guard per-tab save flows.
- Auth context consumers receive strongly typed methods thanks to `authContextSchema`; ensure any custom provider continues returning Promises that resolve to `void`.
- When introducing new marketing metadata or analytics payloads, extend the matching schema and re-export inferred types via `z.infer` instead of introducing raw interfaces.

