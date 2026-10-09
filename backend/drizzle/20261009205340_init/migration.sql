CREATE TABLE `ask_table` (
	`id` text PRIMARY KEY,
	`name` text,
	`show_name` integer NOT NULL,
	`show_ip` integer DEFAULT 0 NOT NULL,
	`ua` text,
	`question` text,
	`answer` text,
	`note` text,
	`public` integer DEFAULT 0 NOT NULL,
	`asked_at` integer,
	`answered_at` integer
);
--> statement-breakpoint
CREATE TABLE `status_data` (
	`key` text PRIMARY KEY,
	`value` text NOT NULL
);
