import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export const ActivityCard = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    <p>No recent activity to display.</p>
                    <p className="text-xs pt-2">This is a placeholder component. Future implementation will show a list of recent user activities.</p>
                </div>
            </CardContent>
        </Card>
    );
};
