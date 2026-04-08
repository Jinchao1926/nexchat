CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`nickname` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "username_length" CHECK(length("users"."username") between 3 and 20),
	CONSTRAINT "nickname_length" CHECK(length("users"."nickname") between 3 and 20)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
