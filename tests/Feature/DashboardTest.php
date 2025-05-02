<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function your_generic_secreted_to_the_login_page()
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function your_generic_secretyour_generic_secret()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get('/dashboard')->assertOk();
    }
}
