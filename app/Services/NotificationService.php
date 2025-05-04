<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Group;
use App\Models\GroupAssignment;

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
} 