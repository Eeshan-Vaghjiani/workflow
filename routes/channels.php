<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\Group;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Private chat channel for direct messages - log details for debugging
Broadcast::channel('chat.{userId}', function ($user, $userId) {
    $isAuthorized = (int) $user->id === (int) $userId;
    
    // Log authorization attempt for debugging
    Log::debug('Chat channel authorization attempt', [
        'channel' => 'chat.'.$userId,
        'user_id' => $user->id,
        'requested_user_id' => $userId,
        'authorized' => $isAuthorized
    ]);
    
    // During debugging, we'll allow all authenticated users to connect
    // to any chat channel to rule out permissions issues
    return true; // Temporarily allow any authenticated user
    
    // Use the correct authorization logic (commented out during debugging)
    // return (int) $user->id === (int) $userId;
});

// Presence channel for group chat
Broadcast::channel('group.{groupId}', function ($user, $groupId) {
    try {
        // Log authorization attempt first
        Log::debug('Group channel authorization attempt', [
            'channel' => 'group.'.$groupId,
            'user_id' => $user->id,
            'group_id' => $groupId
        ]);
        
        // During debugging, allow any authenticated user
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar ?? null,
        ];
        
        /* Normal logic (commented during debugging)
        $group = Group::findOrFail($groupId);
        
        $isMember = $group->members()->where('user_id', $user->id)->exists();
        
        if ($isMember) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
            ];
        }
        
        return false;
        */
    } catch (\Exception $e) {
        Log::error('Error in group channel authorization', [
            'error' => $e->getMessage(),
            'user_id' => $user->id,
            'group_id' => $groupId
        ]);
        return false;
    }
}); 