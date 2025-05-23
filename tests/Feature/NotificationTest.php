<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private NotificationService $notificationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->notificationService = new NotificationService();
    }

    public function test_create_group_invitation_notification()
    {
        $user = User::factory()->create();
        $inviter = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $inviter->id]);

        $notification = $this->notificationService->createGroupInvitation($user, $group, $inviter);

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'user_id' => $user->id,
            'type' => 'group_invitation'
        ]);
    }

    public function test_user_can_view_their_notifications()
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->create([
            'user_id' => $user->id
        ]);

        $response = $this->actingAs($user)->get('/notifications');

        $response->assertOk();
        $response->assertInertia(fn ($assert) => $assert
            ->component('Notifications/Index')
            ->has('notifications', 3)
        );
    }

    public function test_user_can_mark_notification_as_read()
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'read' => false
        ]);

        $response = $this->actingAs($user)
            ->post("/notifications/{$notification->id}/mark-as-read");

        $response->assertRedirect();
        $this->assertTrue($notification->fresh()->read);
    }

    public function test_user_can_mark_all_notifications_as_read()
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->create([
            'user_id' => $user->id,
            'read' => false
        ]);

        $response = $this->actingAs($user)
            ->post('/notifications/mark-all-as-read');

        $response->assertRedirect();
        $this->assertEquals(0, $user->notifications()->where('read', false)->count());
    }

    public function test_user_cannot_mark_other_users_notification_as_read()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $notification = Notification::factory()->create([
            'user_id' => $otherUser->id,
            'read' => false
        ]);

        $response = $this->actingAs($user)
            ->post("/notifications/{$notification->id}/mark-as-read");

        $response->assertStatus(403);
        $this->assertFalse($notification->fresh()->read);
    }
} 