import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { PricingPackage, UserPromptInfo } from '@/types/pricing';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PurchaseConfirmationModal } from '@/components/pricing/PurchaseConfirmationModal';
import { PromptCounter } from '@/components/pricing/PromptCounter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface PricingPageProps extends PageProps {
    packages: PricingPackage[];
    user: UserPromptInfo;
}

export default function Index({ packages, user }: PricingPageProps) {
    const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const handleSelectPackage = (pkg: PricingPackage) => {
        setSelectedPackage(pkg);
        setConfirmModalOpen(true);
    };

    const handlePurchaseComplete = () => {
        // Reload the page to get updated user prompt info
        window.location.reload();
    };

    return (
        <AppLayout>
            <Head title="AI Pricing" />

            <div className="container max-w-7xl py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Prompts Pricing</h1>
                        <p className="text-muted-foreground mt-1">
                            Purchase AI prompts to use our advanced AI features
                        </p>
                    </div>

                    <div className="w-full md:w-64">
                        <PromptCounter
                            promptsRemaining={user.ai_prompts_remaining}
                            totalPurchased={user.total_prompts_purchased}
                            isPaidUser={user.is_paid_user}
                        />
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="mb-8"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="space-y-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Supercharge Your Workflow with AI</h2>
                        <p className="text-muted-foreground">
                            Our AI tools help you create tasks, optimize schedules, and get personalized study recommendations.
                            Choose the package that's right for you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <PricingCard
                                key={pkg.id}
                                package={pkg}
                                userPromptsRemaining={user.ai_prompts_remaining}
                                onSelectPackage={handleSelectPackage}
                            />
                        ))}
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6 mt-12">
                        <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium">What are AI prompts?</h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                    AI prompts are credits that allow you to use our AI-powered features like task generation,
                                    schedule optimization, and study recommendations.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium">How long do prompts last?</h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Your purchased prompts don't expire and will remain in your account until used.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium">Can I get a refund?</h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                    We don't offer refunds for purchased prompts, but we do offer a free trial so you can test our AI features.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PurchaseConfirmationModal
                open={confirmModalOpen}
                onOpenChange={setConfirmModalOpen}
                selectedPackage={selectedPackage}
                onPurchaseComplete={handlePurchaseComplete}
            />
        </AppLayout>
    );
}
