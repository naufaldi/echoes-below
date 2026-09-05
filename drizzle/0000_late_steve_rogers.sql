CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`reserved` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`save_id` text NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `commands` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`save_id` text NOT NULL,
	`hash` text NOT NULL,
	`result` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `dialogues` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`save_id` text NOT NULL,
	`speaker` text NOT NULL,
	`player_text` text NOT NULL,
	`reply_text` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `dialogues_owner_save_time` ON `dialogues` (`owner`,`save_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `previews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saves` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`revision` integer NOT NULL,
	`body` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `saves_owner_updated` ON `saves` (`owner`,`updated_at`);