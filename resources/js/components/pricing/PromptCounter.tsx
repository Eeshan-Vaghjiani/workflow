import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface PromptCounterProps {
    promptsRemaining: number;
    totalPurchased: number;
    isPaidUser: boolean;
}

export function PromptCounter({ promptsRemaining, totalPurchased, isPaidUser }: PromptCounterProps) {
    // Calculate percentage remaining
    const percentage = totalPurchased > 0
        ? Math.max(Math.min(Math.round((promptsRemaining / totalPurchased) * 100), 100), 0)
        : promptsRemaining > 0 ? 100 : 0;

    // Determine status for styling
    let status: 'low' | 'medium' | 'good' = 'good';
    if (percentage <= 10) status = 'low';
    else if (percentage <= 30) status = 'medium';

    const statusColors = {
        low: 'bg-destructive',
        medium: 'bg-warning',
        good: 'bg-primary'
    };

    const statusTextColors = {
        low: 'text-destructive',
        medium: 'text-warning',
        good: 'text-primary'
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Prompts Remaining</span>
                </div>
                <Badge variant={status === 'low' ? 'destructive' : 'outline'}>
                    {promptsRemaining} left
                </Badge>
            </div>

            <Progress
                value={percentage}
                className="h-2"
                indicatorClassName={statusColors[status]}
            />

            <div className="flex justify-between mt-1">
                <span className={`text-xs ${promptsRemaining < 20 ? statusTextColors[status] : ''}`}>
                    {isPaidUser ? `${promptsRemaining}/${totalPurchased}` : `${promptsRemaining}/10 (Trial)`}
                </span>

                {promptsRemaining < 20 && (
                    <span className={`text-xs font-medium ${statusTextColors[status]}`}>
                        {promptsRemaining === 0 ? 'No prompts left!' : 'Running low!'}
                    </span>
                )}
            </div>
        </div>
    );
}
