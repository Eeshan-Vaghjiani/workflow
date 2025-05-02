<?php

namespace App\Policies;

use App\Models\GroupTask;
use App\Models\User;
use App\Models\GroupAssignment;
use Illuminate\Auth\Access\Response;

class GroupTaskPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, GroupTask $task): bool
    {
        return $task->assignment->group->isMember($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, GroupAssignment $assignment): bool
    {
        return $assignment->group->isLeader($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, GroupTask $task): bool
    {
        return $task->assignment->group->isLeader($user) || $task->assigned_to === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, GroupTask $task): bool
    {
        return $task->assignment->group->isLeader($user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, GroupTask $groupTask): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, GroupTask $groupTask): bool
    {
        return false;
    }

    public function complete(User $user, GroupTask $task): bool
    {
        return $task->assigned_to === $user->id;
    }
}
