CREATE TABLE `planning_requests` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`hash` text NOT NULL,
	`started_at` integer NOT NULL,
	`result` text,
	PRIMARY KEY(`owner`, `id`)
);
