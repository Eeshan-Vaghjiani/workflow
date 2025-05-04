<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function your_generic_secretssignment()
    {
        $leader = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $leader->id]);
        $group->members()->attach($leader->id, ['is_leader' => true]);

        $response = $this->actingAs($leader)->post('/group-assignments', [
            'group_id' => $group->id,
            'title' => 'Test Assignment',
            'description' => 'Test Description',
            'due_date' => now()->addDays(7)->toDateTimeString(),
            'unit_name' => 'Test Unit'
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('group_assignments', [
            'group_id' => $group->id,
            'title' => 'Test Assignment'
        ]);
    }

    public function your_generic_secretignment()
    {
        $leader = User::factory()->create();
        $member = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $leader->id]);
        
        $group->members()->attach([
            $leader->id => ['is_leader' => true],
            $member->id => ['is_leader' => false]
        ]);

        $assignment = GroupAssignment::factory()->create([
            'group_id' => $group->id,
            'created_by' => $leader->id
        ]);

        $response = $this->actingAs($member)->get("/group-assignments/{$assignment->id}");
        
        $response->assertOk();
        $response->assertSee($assignment->title);
    }

    public function your_generic_secretask()
    {
        $leader = User::factory()->create();
        $member = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $leader->id]);
        
        $group->members()->attach([
            $leader->id => ['is_leader' => true],
            $member->id => ['is_leader' => false]
        ]);

        $assignment = GroupAssignment::factory()->create([
            'group_id' => $group->id,
            'created_by' => $leader->id
        ]);

        $response = $this->actingAs($member)->post('/tasks', [
            'assignment_id' => $assignment->id,
            'title' => 'Test Task',
            'description' => 'Test Description',
            'due_date' => now()->addDays(5)->toDateTimeString(),
            'status' => 'pending'
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('group_tasks', [
            'assignment_id' => $assignment->id,
            'title' => 'Test Task',
            'created_by' => $member->id
        ]);
    }

    public function your_generic_secretiew_assignment()
    {
        $leader = User::factory()->create();
        $nonMember = User::factory()->create();
        $group = Group::factory()->create(['created_by' => $leader->id]);
        $group->members()->attach($leader->id, ['is_leader' => true]);

        $assignment = GroupAssignment::factory()->create([
            'group_id' => $group->id,
            'created_by' => $leader->id
        ]);

        $response = $this->actingAs($nonMember)->get("/group-assignments/{$assignment->id}");
        
        $response->assertStatus(403);
    }

    public function test_task_status_update()
    {
        $member = User::factory()->create();
        $group = Group::factory()->create();
        $group->members()->attach($member->id);

        $assignment = GroupAssignment::factory()->create([
            'group_id' => $group->id
        ]);

        $task = GroupTask::factory()->create([
            'assignment_id' => $assignment->id,
            'created_by' => $member->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($member)->patch("/tasks/{$task->id}", [
            'status' => 'completed'
        ]);

        $response->assertRedirect();
        $this->assertEquals('completed', $task->fresh()->status);
    }
} 