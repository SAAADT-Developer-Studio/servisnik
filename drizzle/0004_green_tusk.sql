CREATE TYPE "public"."ticket_stage" AS ENUM('TODO', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
ALTER TABLE "ticket" ADD COLUMN "stage" "ticket_stage";