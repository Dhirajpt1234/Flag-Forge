# Rule Definition Schema

## Database Schema

### Prisma Model

```prisma
model RuleDefinition {
  id          String   @id @default(cuid())
  flagId      String
  environment String
  ruleType    String
  priority    Int
  config      Json     // Flexible rule configuration
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  featureFlag FeatureFlag @relation(fields: [flagId], references: [id], onDelete: Cascade)

  @@index([flagId, environment])
  @@index([flagId, environment, priority])
}
```

### SQL Schema

```sql
CREATE TABLE "RuleDefinition" (
    "id" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleDefinition_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance optimization
CREATE INDEX "RuleDefinition_flagId_environment_idx" ON "RuleDefinition"("flagId", "environment");
CREATE INDEX "RuleDefinition_flagId_environment_priority_idx" ON "RuleDefinition"("flagId", "environment", "priority");

-- Foreign key constraint
ALTER TABLE "RuleDefinition" ADD CONSTRAINT "RuleDefinition_flagId_fkey" FOREIGN KEY("flagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```
