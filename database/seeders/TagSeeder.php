<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'Engineering', 'slug' => 'engineering'],
            ['name' => 'HR', 'slug' => 'hr'],
            ['name' => 'Benefits', 'slug' => 'benefits'],
            ['name' => 'Product', 'slug' => 'product'],
        ];

        foreach ($tags as $t) {
            Tag::updateOrCreate(['slug' => $t['slug']], $t);
        }
    }
}
