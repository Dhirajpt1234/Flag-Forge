# Feature Flag Schema

## Database Schema

### Prisma Model

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String
  name        String
  description String
  environment String
  enabled     Boolean  @default(false)
  deleted     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  ruleDefinitions RuleDefinition[]

  @@unique([key, environment])
}
```

### SQL Schema

```sql
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for key + environment combination
CREATE UNIQUE INDEX "FeatureFlag_key_environment_idx" ON "FeatureFlag"("key", "environment");
```
