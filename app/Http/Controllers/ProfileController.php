<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * GET /api/profile
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('tags:id,name,slug');

        $questionsCount = $user->questions()->count();
        $votesReceived  = $user->questions()
                               ->withCount('votes')
                               ->get()
                               ->sum('votes_count');
        $answersCount   = $user->answers()->count();

        return response()->json([
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'role'            => $user->role,
            'tags'            => $user->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
            'stats' => [
                'questions_asked'  => $questionsCount,
                'votes_received'   => $votesReceived,
                'answers_given'    => $answersCount,
            ],
            'questions' => $user->questions()
                                ->withCount('votes')
                                ->with('answer')
                                ->latest()
                                ->get()
                                ->map(fn ($q) => [
                                    'id'          => $q->id,
                                    'title'       => $q->title,
                                    'is_anonymous'=> $q->is_anonymous,
                                    'is_answered' => $q->answer !== null,
                                    'votes_count' => $q->votes_count,
                                    'created_at'  => $q->created_at->toISOString(),
                                ]),
            'answers' => $user->answers()
                              ->with('question:id,title')
                              ->latest()
                              ->get()
                              ->map(fn ($a) => [
                                  'id'         => $a->id,
                                  'body'       => $a->body,
                                  'question'   => $a->question,
                                  'created_at' => $a->created_at->toISOString(),
                              ]),
        ]);
    }

    /**
     * PUT /api/profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'tag_ids'  => ['sometimes', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ]);

        $user->update($validated);

        if ($request->filled('tag_ids')) {
            $user->tags()->sync(array_map('intval', $validated['tag_ids']));
        }

        $user->loadMissing('tags:id,name,slug');

        return response()->json([
            'message' => 'Profile updated.',
            'user'    => [
                'id'   => $user->id,
                'name' => $user->name,
                'email'=> $user->email,
                'role' => $user->role,
                'tags' => $user->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
            ],
        ]);
    }

    /**
     * PUT /api/profile/password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password updated.']);
    }
}