<?php
// database/migrations/2024_01_01_000005_create_answers_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('question_id')
                  ->constrained('questions')
                  ->cascadeOnDelete();

            // The executive/admin who answered — enforced at the application layer
            // (QuestionPolicy / middleware), NOT as a FK to a role-filtered view
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->restrictOnDelete(); // Don't cascade — preserve answer history if exec leaves

            $table->text('body');
            $table->string('video_url', 2048)->nullable(); // Long enough for signed S3 URLs

            $table->timestamps();
        });

        // One question should only have one canonical answer (executive response)
        // If you want multiple answers, drop this and use ordering instead
        DB::statement('CREATE UNIQUE INDEX idx_answers_question_id ON answers (question_id)');

        // Index for "questions answered by executive X" profile view
        DB::statement('CREATE INDEX idx_answers_user_id ON answers (user_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};