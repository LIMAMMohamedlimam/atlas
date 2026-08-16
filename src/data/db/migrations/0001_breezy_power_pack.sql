CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`weight_kg` real,
	`body_fat_pct` real,
	`waist_cm` real,
	`hips_cm` real,
	`chest_cm` real,
	`arm_left_cm` real,
	`arm_right_cm` real,
	`thigh_left_cm` real,
	`thigh_right_cm` real,
	`calf_left_cm` real,
	`calf_right_cm` real,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_measurements_day` ON `body_measurements` (`day`) WHERE "body_measurements"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `diary_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`meal_slot` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`food_id` text,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`grams` real NOT NULL,
	`food_name_snapshot` text NOT NULL,
	`food_brand_snapshot` text,
	`kcal` real NOT NULL,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`sugars_g` real,
	`saturated_fat_g` real,
	`fiber_g` real,
	`salt_g` real,
	`logged_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_diary_meal_slot" CHECK("diary_entries"."meal_slot" IN ('breakfast', 'lunch', 'dinner', 'snack'))
);
--> statement-breakpoint
CREATE INDEX `idx_diary_day` ON `diary_entries` (`day`,`meal_slot`,`sort_order`) WHERE "diary_entries"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_diary_food` ON `diary_entries` (`food_id`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`barcode` text,
	`name` text NOT NULL,
	`brand` text,
	`base_unit` text NOT NULL,
	`energy_kcal` real NOT NULL,
	`protein_g` real,
	`carbs_g` real,
	`sugars_g` real,
	`fat_g` real,
	`saturated_fat_g` real,
	`fiber_g` real,
	`salt_g` real,
	`sodium_mg` real,
	`potassium_mg` real,
	`calcium_mg` real,
	`iron_mg` real,
	`energy_is_estimated` integer DEFAULT 0 NOT NULL,
	`data_quality` integer,
	`is_verified` integer DEFAULT 0 NOT NULL,
	`last_used_at` integer,
	`use_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "ck_foods_source" CHECK("foods"."source" IN ('off', 'usda', 'custom', 'recipe')),
	CONSTRAINT "ck_foods_base_unit" CHECK("foods"."base_unit" IN ('g', 'ml'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_foods_source` ON `foods` (`source`,`source_id`) WHERE "foods"."source_id" IS NOT NULL AND "foods"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `idx_foods_barcode` ON `foods` (`barcode`) WHERE "foods"."barcode" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_foods_frequent` ON `foods` ("use_count" DESC,"last_used_at" DESC) WHERE "foods"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `nutrition_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`effective_from` text NOT NULL,
	`kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`fiber_g` real,
	`water_ml` real,
	`method` text NOT NULL,
	`calc_bmr` real,
	`calc_tdee` real,
	`calc_adjustment_pct` real,
	`below_safety_floor` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "ck_targets_method" CHECK("nutrition_targets"."method" IN ('manual', 'calculated'))
);
--> statement-breakpoint
CREATE INDEX `idx_targets_effective` ON `nutrition_targets` ("effective_from" DESC);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`birth_year` integer,
	`sex` text,
	`height_cm` real,
	`activity_level` text,
	`goal_type` text,
	`unit_system` text DEFAULT 'metric' NOT NULL,
	`locale` text DEFAULT 'fr' NOT NULL,
	`week_starts_on` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "ck_profile_sex" CHECK("user_profile"."sex" IN ('male', 'female', 'unspecified')),
	CONSTRAINT "ck_profile_activity" CHECK("user_profile"."activity_level" IN ('sedentary', 'light', 'moderate', 'very', 'extra')),
	CONSTRAINT "ck_profile_goal" CHECK("user_profile"."goal_type" IN ('lose_slow', 'lose_moderate', 'maintain', 'gain_slow', 'gain_moderate')),
	CONSTRAINT "ck_profile_units" CHECK("user_profile"."unit_system" IN ('metric', 'imperial'))
);
--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`amount_ml` real NOT NULL,
	`logged_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_water_day` ON `water_logs` (`day`) WHERE "water_logs"."deleted_at" IS NULL;