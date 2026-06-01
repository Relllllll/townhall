<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable
{
    use Notifiable, HasApiTokens; 

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    // ---------------------------------------------------------------
    // Role Helpers
    // ---------------------------------------------------------------

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    public function isExecutive(): bool
    {
        return $this->role === 'executive';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function canAnswer(): bool
    {
        return in_array($this->role, ['executive', 'admin']);
    }

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'user_tag');
    }
}