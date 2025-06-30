import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface PromptCounterProps {
    promptsRemaining: number;
    totalPurchased: number;
    isPaidUser: boolean;
    className?: string;
}

export function PromptCounter({ promptsRemaining, totalPurchased, isPaidUser, className }: PromptCounterProps) {
    // Calculate percentage used instead of remaining
    const promptsUsed = totalPurchased - promptsRemaining;
    const percentage = totalPurchased > 0
        ? Math.max(Math.min(Math.round((promptsUsed / totalPurchased) * 100), 100), 0)
        : promptsRemaining > 0 ? 0 : 100;

    // Determine status for styling
    let status: 'low' | 'medium' | 'good' = 'good';
    if (percentage >= 90) status = 'low';
    else if (percentage >= 70) status = 'medium';

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
        <div className={`flex flex-col ${className || ''}`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Prompts Usage</span>
                </div>
                <Badge variant={status === 'low' ? 'destructive' : 'outline'}>
                    {promptsRemaining} left
                </Badge>
            </div>

            <Progress
                value={percentage}
                className={`h-2 ${statusColors[status]}`}
            />

            <div className="flex justify-between mt-1">
                <span className={`text-xs ${promptsRemaining < 20 ? statusTextColors[status] : ''}`}>
                    {isPaidUser ? `${promptsUsed}/${totalPurchased} used` : `${promptsUsed}/10 used (Trial)`}
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
