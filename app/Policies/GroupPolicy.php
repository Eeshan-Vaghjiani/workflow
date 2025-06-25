<?php

namespace App\Policies;

use App\Models\Group;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class GroupPolicy
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
    public function view(User $user, Group $group): bool
    {
        return $group->isMember($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Group $group): bool
    {
        return $group->isLeader($user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Group $group): bool
    {
        return $group->isLeader($user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Group $group): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Group $group): bool
    {
        return false;
    }

    public function addMember(User $user, Group $group): bool
    {
        return $group->isLeader($user);
    }

    public function removeMember(User $user, Group $group): bool
    {
        return $group->isLeader($user);
    }
    public function viewChat(User $user, Group $group): bool
    {
        // The user can view the chat if they are a member of the group.
        return $group->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can send a message to the group.
     */
    public function sendMessage(User $user, Group $group): bool
    {
        // The logic is the same: the user must be a member to send a message.
        return $group->members()->where('user_id', $user->id)->exists();
    }
}
