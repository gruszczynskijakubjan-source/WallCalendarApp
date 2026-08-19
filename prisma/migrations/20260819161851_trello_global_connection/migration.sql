/*
  Warnings:

  - You are about to drop the column `userEmail` on the `TrelloConnection` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `TrelloConnection` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrelloConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKey" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "boardId" TEXT,
    "boardName" TEXT,
    "listId" TEXT,
    "listName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TrelloConnection" ("apiKey", "boardId", "createdAt", "id", "token") SELECT "apiKey", "boardId", "createdAt", "id", "token" FROM "TrelloConnection";
DROP TABLE "TrelloConnection";
ALTER TABLE "new_TrelloConnection" RENAME TO "TrelloConnection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
