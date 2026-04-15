ALTER TABLE `message` ADD `status` text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE `message` ADD `provider` text;--> statement-breakpoint
ALTER TABLE `message` ADD `model` text;--> statement-breakpoint
ALTER TABLE `message` ADD `error` text;