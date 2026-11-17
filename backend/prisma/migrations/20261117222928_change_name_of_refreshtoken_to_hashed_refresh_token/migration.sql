-- Existing sessions store raw refresh tokens, which cannot be matched against
-- the new hashed column. Clear them; affected users simply log in again.
DELETE FROM "login_status";

-- DropIndex
DROP INDEX "login_status_refresh_token_key";

-- AlterTable
ALTER TABLE "login_status" DROP COLUMN "refresh_token",
ADD COLUMN     "hashed_refresh_token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "login_status_hashed_refresh_token_key" ON "login_status"("hashed_refresh_token");

