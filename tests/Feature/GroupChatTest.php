<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\GroupChatMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_message_to_group()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();
        $group->members()->attach($user->id);

        $response = $this->actingAs($user)->post("/api/groups/{$group->id}/messages", [
            'message' => 'Test message'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('group_chat_messages', [
            'group_id' => $group->id,
            'user_id' => $user->id,
            'message' => 'Test message'
        ]);
    }

    public function test_user_can_view_group_messages()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();
        $group->members()->attach($user->id);

        GroupChatMessage::factory()->count(3)->create([
            'group_id' => $group->id,
            'user_id' => $user->id
        ]);

        $response = $this->actingAs($user)->get("/api/groups/{$group->id}/messages");

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }

    public function test_non_member_cannot_access_group_chat()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();

        $response = $this->actingAs($user)->get("/api/groups/{$group->id}/messages");
        
        $response->assertStatus(403);
    }

    public function test_non_member_cannot_send_messages()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();

        $response = $this->actingAs($user)->post("/api/groups/{$group->id}/messages", [
            'message' => 'Test message'
        ]);
        
        $response->assertStatus(403);
    }
} 