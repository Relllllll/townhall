<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    // ---------------------------------------------------------------
    // Middleware check — all methods require admin role
    // ---------------------------------------------------------------

    private function requireAdmin(Request $request): ?JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        return null;
    }

    // ---------------------------------------------------------------
    // Stats Overview
    // ---------------------------------------------------------------

    public function stats(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        return response()->json([
            'total_users'     => User::count(),
            'total_questions' => Question::count(),
            'total_answers'   => Answer::count(),
            'total_votes'     => Vote::count(),
            'anonymous_questions' => Question::where('is_anonymous', true)->count(),
            'unanswered_questions' => Question::whereDoesntHave('answers', 
                fn($a) => $a->where('is_official', true)
            )->count(),
            'users_by_role' => [
                'employee'  => User::where('role', 'employee')->count(),
                'executive' => User::where('role', 'executive')->count(),
                'admin'     => User::where('role', 'admin')->count(),
            ],
        ]);
    }

    // ---------------------------------------------------------------
    // User Management
    // ---------------------------------------------------------------

    public function users(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $users = User::withCount(['questions', 'answers', 'votes'])
            ->with('tags:id,name,slug')
            ->latest()
            ->get()
            ->map(fn($u) => [
                'id'               => $u->id,
                'name'             => $u->name,
                'email'            => $u->email,
                'role'             => $u->role,
                'tags'             => $u->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
                'questions_count'  => $u->questions_count,
                'answers_count'    => $u->answers_count,
                'votes_count'      => $u->votes_count,
                'created_at'       => $u->created_at->toISOString(),
            ]);

        return response()->json($users);
    }

    public function createUser(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'role'     => ['required', 'in:employee,executive,admin'],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return response()->json([
            'message' => 'User created.',
            'user'    => $user,
        ], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $validated = $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'role'  => ['sometimes', 'in:employee,executive,admin'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ]);

        $user->update(collect($validated)->only(['name','email','role'])->toArray());

        if (array_key_exists('tag_ids', $validated)) {
            $user->tags()->sync(array_map('intval', $validated['tag_ids']));
            $user->loadMissing('tags:id,name,slug');
        }

        return response()->json(['message' => 'User updated.', 'user' => $user]);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        // Prevent self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete yourself.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    // ---------------------------------------------------------------
    // Question Management
    // ---------------------------------------------------------------

    public function questions(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $questions = Question::withoutTrashed()
            ->withCount(['votes', 'answers'])
            ->with('user:id,name,role')
            ->latest()
            ->get()
            ->map(fn($q) => [
                'id'           => $q->id,
                'title'        => $q->title,
                'is_anonymous' => $q->is_anonymous,
                'is_answered'  => $q->answers_count > 0,
                'votes_count'  => $q->votes_count,
                'answers_count'=> $q->answers_count,
                'views_count'  => $q->views_count,
                'author'       => $q->user ? $q->user->name : 'Anonymous',
                'created_at'   => $q->created_at->toISOString(),
            ]);

        return response()->json($questions);
    }

    public function deleteQuestion(Request $request, Question $question): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }

    // ---------------------------------------------------------------
    // Answer Management
    // ---------------------------------------------------------------

    public function deleteAnswer(Request $request, Answer $answer): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $answer->delete();

        return response()->json(['message' => 'Answer deleted.']);
    }


    public function trash()
    {
        $trashedQuestions = Question::onlyTrashed()->get();
        return response()->json($trashedQuestions); // Return JSON array
    }
    public function restore($id)
    {
        $question = Question::withTrashed()->findOrFail($id);
        $question->restore(); 
        return response()->json(['message' => 'Restored successfully']); // Return JSON
    }

    public function forceDelete($id)
    {
        $question = Question::withTrashed()->findOrFail($id);
        $question->forceDelete(); 
        return response()->json(['message' => 'Permanently deleted']); // Return JSON
    }
}