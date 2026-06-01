<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnswerResource;
use App\Models\Answer;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    /**
     * POST /api/questions/{question}/answers
     * Any authenticated user can answer.
     * Executives/admins can mark as official.
     */
    public function store(Request $request, Question $question): JsonResponse
    {
        $validated = $request->validate([
            'body'      => ['required', 'string', 'min:20'],
            'video_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
        ]);

        $user = $request->user();

        // Only one official answer allowed per question
        $isOfficial = $user->canAnswer() &&
                      ! $question->answers()->where('is_official', true)->exists();

        $answer = Answer::create([
            'question_id' => $question->id,
            'user_id'     => $user->id,
            'body'        => $validated['body'],
            'video_url'   => $validated['video_url'] ?? null,
            'is_official' => $isOfficial,
        ]);

        $answer->load('executive:id,name,role');

        return (new AnswerResource($answer))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/questions/{question}/answers/{answer}
     * Only the answer author can edit their own answer.
     */
    public function update(Request $request, Question $question, Answer $answer): JsonResponse
    {
        if ($answer->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'body'      => ['required', 'string', 'min:20'],
            'video_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
        ]);

        $answer->update($validated);
        $answer->load('executive:id,name,role');

        return response()->json(new AnswerResource($answer));
    }

    /**
     * PUT /api/questions/{question}/answers/{answer}/official
     * Executives/admins can mark an answer as official.
     */
    public function markOfficial(Request $request, Question $question, Answer $answer): JsonResponse
    {
        if (! $request->user()->canAnswer()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Remove official from any existing official answer
        $question->answers()->where('is_official', true)->update(['is_official' => false]);

        $answer->update(['is_official' => true]);

        return response()->json(['message' => 'Marked as official.']);
    }
}