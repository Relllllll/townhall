<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    // Votes are immutable — no updated_at needed
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'question_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // ---------------------------------------------------------------
    // Auto-set created_at on insert
    // ---------------------------------------------------------------

   

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}