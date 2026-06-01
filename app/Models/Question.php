<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;


class Question extends Model
{
    use softDeletes;
    protected $fillable = [
        'user_id',
        'anonymous_token',
        'title',
        'body',
        'is_anonymous',
        'views_count',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'views_count'  => 'integer',
        'votes_count'  => 'integer',  // 👈 add
        'has_voted'    => 'boolean',  // 👈 add
    ];

    // These fields never leave the backend
    protected $hidden = [
        'anonymous_token',
        'user_id',
    ];

    // ---------------------------------------------------------------
    // Anonymity Guard
    // ---------------------------------------------------------------

    /**
     * Strip the author from the response if the question is anonymous.
     * This runs automatically on toArray() and toJson() — meaning
     * even accidental logging won't leak the author.
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        if ($this->is_anonymous) {
            unset($array['user_id'], $array['user']);
        }

        return $array;
    }

    /**
     * Admin/moderator only — call this explicitly to reveal the author.
     * Never call this in public-facing controllers.
     */
    public function makeAuthorVisible(): static
    {
        return $this->makeVisible(['user_id']);
    }

    // ---------------------------------------------------------------
    // Relationships
    // ---------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withDefault([
            'name' => 'Anonymous Employee',
        ]);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function answer(): HasOne
    {
        return $this->hasOne(Answer::class)->where('is_official', true);
    }
    public function answers(): HasMany
    {
    return $this->hasMany(Answer::class)->latest();
    }


    public function auditLog(): HasOne
    {
        return $this->hasOne(QuestionAuditLog::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'question_tag');
    }

    // ---------------------------------------------------------------
    // Query Scopes
    // ---------------------------------------------------------------

    /**
     * The Executive Queue: unanswered questions ranked by vote count.
     *
     * Usage: Question::executiveQueue()->paginate(20)
     */
    public function scopeExecutiveQueue(Builder $query): Builder
    {
        return $query
            ->select('questions.*')
            ->selectRaw('COUNT(votes.id) AS votes_count')
            ->leftJoin('votes', 'votes.question_id', '=', 'questions.id')
            ->whereDoesntHave('answer')
            ->groupBy('questions.id')
            ->orderByRaw('votes_count DESC')
            ->orderBy('questions.created_at', 'desc');
    }

    /**
     * Friday TownHall Agenda: top 5 unanswered questions from the last 7 days.
     *
     * Usage: Question::weeklyAgenda()->get()
     */
    public function scopeWeeklyAgenda(Builder $query): Builder
    {
        return $query
            ->executiveQueue()
            ->where('questions.created_at', '>=', now()->subDays(7))
            ->limit(5);
    }

    public function incrementViewCount(): void
    {
        $this->increment('views_count');
    }
}