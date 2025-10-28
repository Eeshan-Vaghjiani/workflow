<?php

namespace App\Models;

use Illuminate\Support\Collection;

class Assignment extends GroupAssignment
{
    // This class extends GroupAssignment for backwards compatibility
    
    // Map groups relation using group
    public function groups()
    {
        if ($this->group) {
            return Group::where('id', $this->group_id)->get();
        }
        return Collection::make([]);
    }
    
    // Map start_date to created_at for compatibility
    public function getStartDateAttribute()
    {
        return $this->created_at;
    }
    
    // Map end_date to due_date
    public function getEndDateAttribute()
    {
        return $this->due_date;
    }
} 