<?php

namespace App\Models;

class Assignment extends GroupAssignment
{
    // This class extends GroupAssignment for backwards compatibility
    
    // Map groups relation using group
    public function groups()
    {
        return $this->group() ? collect([$this->group]) : collect([]);
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