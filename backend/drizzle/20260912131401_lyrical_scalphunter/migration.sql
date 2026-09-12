CREATE TABLE `ask_table` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` text,
	`show_name` int NOT NULL,
	`show_ip` int NOT NULL DEFAULT 0,
	`ua` text,
	`question` text,
	`answer` text,
	`note` text,
	`public` int NOT NULL DEFAULT 0,
	`asked_at` bigint,
	`answered_at` bigint
);
