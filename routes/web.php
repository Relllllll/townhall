<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Feed');
});

Route::get('/login', function () {
    return Inertia::render('Login');
});

Route::get('/profile', function () {
    return Inertia::render('Profile');
});

Route::get('/questions/{id}', function ($id) {
    return Inertia::render('Question', ['id' => $id]);
});
Route::get('/admin', function () {
    return Inertia::render('Admin');
});