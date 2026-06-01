#!/bin/bash
cd /mnt/c/Users/aurel/Herd/TownHall
php artisan make:event QuestionVoted --no-interaction
php artisan make:event AnswerPosted --no-interaction
