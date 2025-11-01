import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Lightbulb } from 'lucide-react';
import { router } from '@inertiajs/react';

interface PromptsExhaustedModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalPurchased: number;
}

export function PromptsExhaustedModal({
    open,
    onOpenChange,
    totalPurchased
}: PromptsExhaustedModalProps) {
    const handleBuyMore = () => {
        router.visit('/pricing');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full mb-4">
                        <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <DialogTitle className="text-center text-xl">You're Out of AI Prompts</DialogTitle>
                    <DialogDescription className="text-center">
                        You've used all {totalPurchased} of your purchased AI prompts. Purchase more to continue using our AI features.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-3 py-4">
                    <div className="rounded-lg border p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Your usage summary
                        </p>
                        <p className="text-2xl font-semibold">{totalPurchased} prompts used</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Purchase a new package to continue
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Maybe Later
                    </Button>
                    <Button onClick={handleBuyMore}>
                        Buy More Prompts
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
