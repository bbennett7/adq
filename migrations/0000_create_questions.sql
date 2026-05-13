CREATE TABLE "question_resources" (
	"question_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "question_resources_question_id_resource_id_pk" PRIMARY KEY("question_id","resource_id")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer,
	"question_md" text NOT NULL,
	"question_pt" text NOT NULL,
	"answer_md" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"embedding" vector(1536),
	CONSTRAINT "questions_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"label" text NOT NULL,
	"source" text NOT NULL,
	"author" text,
	"embedding" vector(1536),
	CONSTRAINT "resources_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "question_resources" ADD CONSTRAINT "question_resources_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_resources" ADD CONSTRAINT "question_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;