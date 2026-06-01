<?php

namespace App\Http\Controllers;

use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Models\QuestionAuditLog;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QuestionController extends Controller
{
    // ---------------------------------------------------------------
    // INDEX — Main feed
    // ---------------------------------------------------------------

    /**
     * GET /api/questions
     *
     * ?feed=latest   → newest questions first (default)
     * ?feed=top      → unanswered, highest voted (Executive Queue)
     * ?feed=agenda   → top 5 unanswered from last 7 days (TownHall Agenda)
     */
public function index(Request $request): AnonymousResourceCollection
{
    $validated = $request->validate([
        'feed'      => ['sometimes', Rule::in(['latest', 'top', 'agenda'])],
        'per_page'  => ['sometimes', 'integer', 'min:5', 'max:50'],
        'search'    => ['sometimes', 'string', 'max:100'],
        'filter'    => ['sometimes', Rule::in(['all', 'anonymous', 'public', 'answered', 'unanswered'])],
        'tag_id'    => ['sometimes', 'integer', 'exists:tags,id'],
        'tag_slug'  => ['sometimes', 'string', 'max:50'],
    ]);

    $feed     = $validated['feed'] ?? 'latest';
    $perPage  = $validated['per_page'] ?? 20;
    $search   = $validated['search'] ?? null;
    $filter   = $validated['filter'] ?? 'all';
    $userId   = $request->user()?->id;

    $query = Question::query()
        ->select('questions.*')
        ->selectRaw('COUNT(DISTINCT votes.id) AS votes_count')
        ->leftJoin('votes', 'votes.question_id', '=', 'questions.id')
        ->with([
        'user:id,name,role',
        'answers.executive:id,name,role', // 👈 changed
        'tags:id,name,slug',
        ])
        ->groupBy('questions.id');

    if ($userId) {
        $query->selectRaw(
            'EXISTS (
                SELECT 1 FROM votes AS uv
                WHERE uv.question_id = questions.id
                AND uv.user_id = ?
            ) AS has_voted',
            [$userId]
        );
    }

    // --- Search ---
    if ($search) {
        $query->where(function ($q) use ($search) {
            // Always search title and body
            $q->where('questions.title', 'ilike', "%{$search}%")
              ->orWhere('questions.body', 'ilike', "%{$search}%");

            // Search author name only for non-anonymous posts
            $q->orWhere(function ($q2) use ($search) {
                $q2->where('questions.is_anonymous', false)
                   ->whereHas('user', fn ($u) => 
                       $u->where('name', 'ilike', "%{$search}%")
                   );
            });
        });
    }

    // --- Filters ---
    match ($filter) {
        'anonymous'   => $query->where('questions.is_anonymous', true),
        'public'      => $query->where('questions.is_anonymous', false),
        'answered'    => $query->whereHas('answer'),
        'unanswered'  => $query->whereDoesntHave('answer'),
        default       => null,
    };

    // --- Tag filter (by id or slug) ---
    if (!empty($validated['tag_id'])) {
        $query->whereHas('tags', fn ($q) => $q->where('tags.id', $validated['tag_id']));
    } elseif (!empty($validated['tag_slug'])) {
        $query->whereHas('tags', fn ($q) => $q->where('tags.slug', $validated['tag_slug']));
    }

    // --- Feed mode ---
    $questions = match ($feed) {
        'top' => $query
            ->where(function ($q) {$q->whereDoesntHave('answers', fn ($a) => $a->where('is_official', true));})
            ->orderByRaw('votes_count DESC')
            ->orderBy('questions.created_at', 'desc')
            ->paginate($perPage),

        'agenda' => $query
            ->where(function ($q) {$q->whereDoesntHave('answers', fn ($a) => $a->where('is_official', true));})
            ->where('questions.created_at', '>=', now()->subDays(7))
            ->orderByRaw('votes_count DESC')
            ->limit(5)
            ->get(),

        default => $query
            ->orderBy('questions.created_at', 'desc')
            ->paginate($perPage),
    };

    return QuestionResource::collection($questions);
}

    // ---------------------------------------------------------------
    // SHOW — Single question
    // ---------------------------------------------------------------

    /**
     * GET /api/questions/{question}
     */
 public function show(Request $request, Question $question): \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
{
    $userId = $request->user()?->id;

    $question->incrementViewCount();

    $question->loadMissing([
        'user:id,name,role',
        'answers.executive:id,name,role',
        'tags:id,name,slug',
    ]);

    $question->setAttribute('votes_count', $question->votes()->count());
    $question->setAttribute('has_voted', $userId
        ? Vote::where('user_id', $userId)
              ->where('question_id', $question->id)
              ->exists()
        : false);

    return (new QuestionResource($question))->response();
}

    // ---------------------------------------------------------------
    // STORE — Submit a question (anonymous or public)
    // ---------------------------------------------------------------

    /**
     * POST /api/questions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'body'         => ['required', 'string', 'min:10', 'max:5000'],
            'is_anonymous' => ['required', 'boolean'],
        ]);

        $user = $request->user();

        $question = DB::transaction(function () use ($validated, $user, $request) {

            if ($validated['is_anonymous']) {

                // --- ANONYMOUS PATH ---
                // Step 1: Insert question with NO user_id
                $question = Question::create([
                    'user_id'      => null,
                    'title'        => $validated['title'],
                    'body'         => $validated['body'],
                    'is_anonymous' => true,
                ]);

                // Step 2: Generate HMAC token for moderation
                // One-way fingerprint — cannot be reversed from the frontend
                $token = hash_hmac(
                    'sha256',
                    $user->id . '|' . $question->id . '|' . config('app.name'),
                    config('app.key')
                );

                $question->update(['anonymous_token' => $token]);

                // Step 3: Store real author ONLY in the audit log
                QuestionAuditLog::create([
                    'question_id' => $question->id,
                    'user_id'     => $user->id,
                    'ip_address'  => $request->ip(),
                    'user_agent'  => $request->userAgent(),
                ]);

            } else {

                // --- PUBLIC PATH ---
                $question = Question::create([
                    'user_id'      => $user->id,
                    'title'        => $validated['title'],
                    'body'         => $validated['body'],
                    'is_anonymous' => false,
                ]);
            }

            // Attach tags if provided
            if ($request->filled('tag_ids') && is_array($request->input('tag_ids'))) {
                $question->tags()->attach(array_map('intval', $request->input('tag_ids')));
            }

            return $question;
        });

        // Fresh load for the response
        $question->loadMissing(['user:id,name,role', 'answer', 'tags:id,name,slug']);
        $question->votes_count = 0;
        $question->has_voted   = false;

        return (new QuestionResource($question))
            ->response()
            ->setStatusCode(201);
    }

    // ---------------------------------------------------------------
    // INCREMENT VIEW — called internally by show()
    // ---------------------------------------------------------------

    /**
     * Atomic view count increment lives on the model.
     * Defined here as a reminder it exists.
     *
     * $question->incrementViewCount()
     * → calls $this->increment('views_count') under the hood
     */

    public function restore($id)
{
    // We have to use withTrashed() to find it, because normal find() ignores deleted items!
    $question = Question::withTrashed()->findOrFail($id);
    $question->restore(); // This sets deleted_at back to null

    return back()->with('success', 'Question restored to the live feed!');
}
public function forceDelete($id)
{
    $question = Question::withTrashed()->findOrFail($id);
    $question->forceDelete(); // This actually erases the row from the PostgreSQL database forever

    return back()->with('success', 'Question permanently destroyed.');
}
}