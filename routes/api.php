<?php

use App\Http\Controllers\AnswerController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Http\Controllers\AdminController;

// Auth
Route::post('/login', function (Request $request) {
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials.'], 401);
    }

    $token = $user->createToken('townhall')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user'  => [
            'id'   => $user->id,
            'name' => $user->name,
            'role' => $user->role,
        ],
    ]);
});

Route::post('/logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out.']);
})->middleware('auth:sanctum');

// Public
Route::get('/questions',            [QuestionController::class, 'index']);
Route::get('/questions/{question}', [QuestionController::class, 'show']);

// Tags endpoint
Route::get('/tags', function () {
    return App\Models\Tag::select('id','name','slug')->get();
});

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/questions',                    [QuestionController::class, 'store']);
    Route::post('/questions/{question}/vote',    [VoteController::class, 'toggle']);
    Route::post('/questions/{question}/answers',                  [AnswerController::class, 'store']);
    Route::put('/questions/{question}/answers/{answer}',          [AnswerController::class, 'update']);
    Route::put('/questions/{question}/answers/{answer}/official', [AnswerController::class, 'markOfficial']);
    // Profile
    Route::get('/profile',          [ProfileController::class, 'show']);
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::prefix('admin')->group(function () {
    Route::get('/stats',                    [AdminController::class, 'stats']);
    Route::get('/users',                    [AdminController::class, 'users']);
    Route::post('/users',                   [AdminController::class, 'createUser']);
    Route::put('/users/{user}',             [AdminController::class, 'updateUser']);
    Route::delete('/users/{user}',          [AdminController::class, 'deleteUser']);
    Route::get('/questions',                [AdminController::class, 'questions']);
    Route::delete('/questions/{question}',  [AdminController::class, 'deleteQuestion']);
    Route::delete('/answers/{answer}',      [AdminController::class, 'deleteAnswer']);
    Route::get('/trash',                    [AdminController::class, 'trash']);
    Route::patch('/trash/{id}/restore',     [AdminController::class, 'restore']);
    Route::delete('/trash/{id}/force-delete', [AdminController::class, 'forceDelete']);
});
});