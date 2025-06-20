<?php

namespace App\Models;

class Task extends GroupTask
{
    // This class extends GroupTask for backwards compatibility

    // Map user_id to assigned_user_id
    public function getUserIdAttribute()
    {
        return $this->assigned_user_id;
    }

    public function setUserIdAttribute($value)
    {
        $this->attributes['assigned_user_id'] = $value;
    }

    // Map group relation through assignment
    public function group()
    {
        return $this->assignment->group();
    }

    // For progress mapping if needed
    public function getProgressAttribute()
    {
        return $this->status === 'completed' ? 100 : ($this->status === 'in_progress' ? 50 : 0);
    }
}
