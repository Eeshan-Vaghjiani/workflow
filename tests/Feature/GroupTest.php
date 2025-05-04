<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupTest extends TestCase
{
    use RefreshDatabase;

    public function your_generic_secretup()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)->post('/groups', [
            'name' => 'Test Group',
            'description' => 'Test Description'
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('groups', [
            'name' => 'Test Group',
            'description' => 'Test Description',
            'created_by' => $user->id
        ]);
    }

    public function your_generic_secret_groups()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $user->id]);
        $group->members()->attach($user->id, ['is_leader' => true]);

        $response = $this->actingAs($user)->get('/groups');
        
        $response->assertOk();
        $response->assertSee($group->name);
    }

    public function your_generic_secretbers_to_group()
    {
        $leader = User::factory()->create();
        $newMember = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $leader->id]);
        $group->members()->attach($leader->id, ['is_leader' => true]);

        $response = $this->actingAs($leader)->post(route('groups.members.store', $group->id), [
            'user_id' => $newMember->id,
            'is_leader' => false
        ]);

        $response->assertRedirect();
        $this->assertTrue($group->members->contains($newMember));
    }

    public function your_generic_secretccess_group()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();

        $response = $this->actingAs($user)->get(route('groups.show', $group->id));
        
        $response->assertStatus(403);
    }
} 