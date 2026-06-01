<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
public function up(): void
{
    Schema::table('answers', function (Blueprint $table) {
        $table->boolean('is_official')->default(false)->after('user_id');
    });

    // Drop the unique index created via DB::statement
    DB::statement('DROP INDEX IF EXISTS idx_answers_question_id');
}

    public function down(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->dropColumn('is_official');
            $table->unique('question_id');
        });
    }
};