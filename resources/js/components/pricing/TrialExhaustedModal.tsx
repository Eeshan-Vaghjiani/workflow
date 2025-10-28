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
import { Sparkles } from 'lucide-react';
import { router } from '@inertiajs/react';

interface TrialExhaustedModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TrialExhaustedModal({ open, onOpenChange }: TrialExhaustedModalProps) {
    const handleUpgrade = () => {
        router.visit('/pricing');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Your Free Trial is Over</DialogTitle>
                    <DialogDescription className="text-center">
                        You've used all 10 of your free AI prompts. Upgrade now to continue using our AI features.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-3 py-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm">Generate AI tasks and assignments</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm">Get AI-powered study recommendations</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm">Optimize your study schedule with AI</p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Maybe Later
                    </Button>
                    <Button onClick={handleUpgrade}>
                        Upgrade Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
