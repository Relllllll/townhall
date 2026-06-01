<?php
// database/migrations/2024_01_01_000004_create_votes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete(); // Vote is meaningless without the voter

            $table->foreignId('question_id')
                  ->constrained('questions')
                  ->cascadeOnDelete(); // Vote is meaningless without the question

            // Prevent double-voting at the database constraint level (not just application level)
            $table->unique(['user_id', 'question_id'], 'uq_votes_user_question');

            $table->timestamp('created_at')->useCurrent();
            // No updated_at — votes are immutable (toggle handled by delete + re-insert)
        });

        // Covering index for "how many votes does question X have?" — the most common query
        DB::statement('CREATE INDEX idx_votes_question_id ON votes (question_id)');

        // Allows "has the current user voted on this question?" in O(1)
        DB::statement('CREATE INDEX idx_votes_user_question ON votes (user_id, question_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};