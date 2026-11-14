-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('day', 'dusk');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "theme" "Theme";

