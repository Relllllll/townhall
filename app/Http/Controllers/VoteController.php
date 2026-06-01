<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    /**
     * POST /api/questions/{question}/vote
     *
     * Toggles a vote on a question.
     * - If the user hasn't voted → creates a vote
     * - If the user already voted → removes the vote
     */
    public function toggle(Request $request, Question $question): JsonResponse
    {
        $user = $request->user();

        // Check if vote already exists
        $existingVote = Vote::where('user_id', $user->id)
                            ->where('question_id', $question->id)
                            ->first();

        $voted = false;
        if ($existingVote) {
            // Already voted — remove it (toggle off)
            $existingVote->delete();
            $voted = false;
        } else {
            // Not voted yet — create it (toggle on)
            Vote::create([
                'user_id'     => $user->id,
                'question_id' => $question->id,
            ]);
            $voted = true;
        }

        $votes_count = $question->votes()->count();

        // Broadcast to all listening clients
        broadcast(new \stdClass())->toOthers(); // Placeholder
        
        return response()->json([
            'voted'       => $voted,
            'votes_count' => $votes_count,
            'message'     => $voted ? 'Vote recorded.' : 'Vote removed.',
        ]);
    }
}