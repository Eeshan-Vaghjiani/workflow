<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Group;
use App\Models\GroupAssignment;
use App\Models\GroupTask;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Create a group invitation notification.
     *
     * @param User $user The user to notify
     * @param Group $group The group being invited to
     * @param User $inviter The user sending the invitation
     * @return Notification
     */
    public function createGroupInvitation(User $user, Group $group, User $inviter)
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'group_invitation',
            'data' => [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'inviter_id' => $inviter->id,
                'inviter_name' => $inviter->name,
            ],
            'read' => false,
        ]);
    }

    /**
     * Create an assignment due notification.
     *
     * @param User $user The user to notify
     * @param GroupAssignment $assignment The assignment that is due
     * @return Notification
     */
    public function createAssignmentDue(User $user, GroupAssignment $assignment)
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'assignment_due',
            'data' => [
                'assignment_id' => $assignment->id,
                'assignment_title' => $assignment->title,
                'group_id' => $assignment->group_id,
                'group_name' => $assignment->group->name,
                'due_date' => $assignment->due_date->format('Y-m-d'),
            ],
            'read' => false,
        ]);
    }

    /**
     * Create a new assignment notification.
     *
     * @param User $user The user to notify
     * @param GroupAssignment $assignment The newly created assignment
     * @param User $creator The user who created the assignment
     * @return Notification
     */
    public function createNewAssignment(User $user, GroupAssignment $assignment, User $creator)
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'assignment_created',
            'data' => [
                'assignment_id' => $assignment->id,
                'assignment_title' => $assignment->title,
                'group_id' => $assignment->group_id,
                'group_name' => $assignment->group->name,
                'creator_id' => $creator->id,
                'creator_name' => $creator->name,
                'due_date' => $assignment->due_date->format('Y-m-d'),
            ],
            'read' => false,
        ]);
    }

    /**
     * Create a notification for a user when they are assigned a task.
     */
    public function createTaskAssignment(User $user, GroupTask $task, User $assigner): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'task_assignment',
            'data' => [
                'task_id' => $task->id,
                'task_title' => $task->title,
                'assigner_id' => $assigner->id,
                'assigner_name' => $assigner->name,
                'group_id' => $task->assignment->group_id,
                'group_name' => $task->assignment->group->name,
                'assignment_id' => $task->assignment_id,
                'assignment_title' => $task->assignment->title,
            ],
            'read' => false,
        ]);
    }
    
    /**
     * Create a notification for approaching task deadlines.
     */
    public function createDeadlineReminders(): void
    {
        // Find tasks that are due in the next 24 hours and have not had a reminder sent
        $approachingTasks = GroupTask::where('end_date', '>=', Carbon::now())
            ->where('end_date', '<=', Carbon::now()->addHours(24))
            ->where('status', '!=', 'completed')
            ->whereDoesntHave('notifications', function ($query) {
                $query->where('type', 'deadline_reminder')
                    ->where('created_at', '>=', Carbon::now()->subHours(12));
            })
            ->with(['assignedUser', 'assignment.group'])
            ->get();
        
        foreach ($approachingTasks as $task) {
            if (!$task->assignedUser) continue;
            
            Notification::create([
                'user_id' => $task->assignedUser->id,
                'type' => 'deadline_reminder',
                'data' => [
                    'task_id' => $task->id,
                    'task_title' => $task->title,
                    'due_date' => $task->end_date->format('Y-m-d H:i:s'),
                    'group_id' => $task->assignment->group_id,
                    'group_name' => $task->assignment->group->name,
                    'assignment_id' => $task->assignment_id,
                    'assignment_title' => $task->assignment->title,
                ],
                'read' => false,
            ]);
        }
    }
    
    /**
     * Create a notification for new chat messages.
     */
    public function your_generic_secretn(User $user, string $senderName, string $content, string $type, int $sourceId): Notification
    {
        $truncatedContent = strlen($content) > 50 
            ? substr($content, 0, 50) . '...' 
            : $content;
            
        $data = [
            'sender_name' => $senderName,
            'content' => $truncatedContent,
        ];
        
        if ($type === 'direct') {
            $data['sender_id'] = $sourceId;
        } else {
            $data['group_id'] = $sourceId;
        }
        
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type . '_message',
            'data' => $data,
            'read' => false,
        ]);
    }

    /**
     * Create a notification for join request.
     */
    public function createGroupJoinRequest(Group $group, User $requester): Notification
    {
        // Find group leader(s) to notify
        $leaders = $group->members()->where('role', 'owner')->get();
        
        $notifications = [];
        
        foreach ($leaders as $leader) {
            $notifications[] = Notification::create([
                'user_id' => $leader->id,
                'type' => 'group_join_request',
                'data' => [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'requester_id' => $requester->id,
                    'requester_name' => $requester->name,
                ],
                'read' => false,
            ]);
        }
        
        return $notifications[0] ?? null; // Return first notification or null if none created
    }
    
    /**
     * Create a notification for approved join request.
     */
    public function createGroupJoinApproved(User $user, Group $group, User $approver): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => 'group_join_approved',
            'data' => [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'approver_id' => $approver->id,
                'approver_name' => $approver->name,
            ],
            'read' => false,
        ]);
    }
} 