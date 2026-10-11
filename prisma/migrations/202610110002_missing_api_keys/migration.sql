-- Initialize only the existing administrator explicitly authorized by the owner.
UPDATE "users"
SET "apiKey" = 'smm_live_' || replace(gen_random_uuid()::text, '-', ''), "updatedAt" = timezone('UTC', now())
WHERE "id" = (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' ORDER BY "createdAt", "id" LIMIT 1)
AND ("apiKey" IS NULL OR "apiKey" = '');
