<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'body'        => $this->body,
            'is_anonymous'=> $this->is_anonymous,
            'views_count' => $this->views_count,
            'created_at'  => $this->created_at->toISOString(),

            // Vote count — comes from the JOIN in the controller query
            'votes_count' => (int) ($this->votes_count ?? 0),

            // Whether the current logged-in user has already voted on this
            'has_voted' => (bool) ($this->has_voted ?? false),

            // Whether this question has been answered
            // current broken version
            'is_answered' => $this->relationLoaded('answers') && $this->answers->isNotEmpty(),
            'answer' => $this->whenLoaded(
            'answers',
            fn () => $this->answers->firstWhere('is_official', true)
            ? new AnswerResource($this->answers->firstWhere('is_official', true))
            : null
            ),
            // -------------------------------------------------------
            // THE ANONYMITY GUARD
            // If is_anonymous is true, the 'author' key is completely
            // absent from the JSON — not null, not hidden, just gone.
            // A user inspecting the network tab will find nothing.
            // -------------------------------------------------------
            'author' => $this->when(
                ! $this->is_anonymous,
                fn () => new UserResource($this->whenLoaded('user'))
            ),

            // Tags
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
            ])),

            // The official executive answer if it exists
            'answers' => $this->whenLoaded(
            'answers',
            fn () => AnswerResource::collection($this->answers)
            ),
        ];
    }
}