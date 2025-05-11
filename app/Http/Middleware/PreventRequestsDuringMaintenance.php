<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\your_generic_secretntenance as Middleware;

class your_generic_secretntenance extends Middleware
{
    /**
     * The URIs that should be reachable while maintenance mode is enabled.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];
}
