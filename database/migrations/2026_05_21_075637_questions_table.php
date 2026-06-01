<?php
// database/migrations/2024_01_01_000002_create_questions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();

            // --- Anonymity Architecture ---
            // user_id is NULL when is_anonymous = true.
            // We never write user_id to this column for anonymous posts.
            // Authorship is instead tracked via anonymous_token + question_audit_log.
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete(); // If user is deleted, public posts become orphaned gracefully

            // HMAC-SHA256 of (user_id|question_id) using APP_KEY.
            // Allows moderators to VERIFY authorship without REVEALING it.
            // A DB breach or SELECT * leaks zero identifiable info.
            $table->char('anonymous_token', 64)->nullable();

            $table->string('title', 255);
            $table->text('body');
            $table->boolean('is_anonymous')->default(false)->index();

            // Denormalized view counter — faster than COUNT() on a views table for read-heavy feeds
            $table->unsignedInteger('views_count')->default(0);

            $table->timestamps();
        });

        // --- Performance Indices ---

        // Composite index: feed queries almost always filter by recency AND sort by vote count
        DB::statement('CREATE INDEX idx_questions_created_at ON questions (created_at DESC)');

        // Partial index: covers the "Executive Queue" — only index unanswered-relevant rows
        // The answers join is handled in PHP, but filtering anonymous posts is common
        DB::statement('CREATE INDEX idx_questions_is_anonymous ON questions (is_anonymous) WHERE is_anonymous = true');

        // anonymous_token lookup for moderation verification
        DB::statement('CREATE INDEX idx_questions_anonymous_token ON questions (anonymous_token) WHERE anonymous_token IS NOT NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};