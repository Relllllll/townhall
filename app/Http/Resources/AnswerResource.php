<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnswerResource extends JsonResource
{
public function toArray(Request $request): array
{
    return [
        'id'          => $this->id,
        'body'        => $this->body,
        'video_url'   => $this->video_url,
        'is_official' => $this->is_official,
        'created_at'  => $this->created_at->toISOString(),
        'executive'   => new UserResource($this->whenLoaded('executive')),
    ];
}
}