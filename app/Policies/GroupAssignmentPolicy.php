<?php

namespace App\Policies;

use App\Models\GroupAssignment;
use App\Models\User;
use App\Models\Group;
use Illuminate\Auth\Access\Response;

class GroupAssignmentPolicy
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
    public function view(User $user, GroupAssignment $assignment): bool
    {
        return $assignment->group->isMember($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Group $group): bool
    {
        return $group->isLeader($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, GroupAssignment $assignment): bool
    {
        return $assignment->group->isLeader($user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, GroupAssignment $assignment): bool
    {
        return $assignment->group->isLeader($user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, GroupAssignment $groupAssignment): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, GroupAssignment $groupAssignment): bool
    {
        return false;
    }
}
