<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
protected $fillable = [
    'question_id',
    'user_id',
    'body',
    'video_url',
    'is_official',
];

protected $casts = [
    'is_official' => 'boolean',
    'created_at'  => 'datetime',
    'updated_at'  => 'datetime',
];

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /**
     * The executive who posted this answer.
     * Named 'executive' to make intent clear in API responses.
     */
    public function executive(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}