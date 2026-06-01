<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->string('role')->default('employee');  // plain string column
        $table->rememberToken();
        $table->timestamps();
    });

    // Enforce valid values at the database level via a CHECK constraint
    DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('employee', 'executive', 'admin'))");

    DB::statement('CREATE INDEX idx_users_role ON users (role)');
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
