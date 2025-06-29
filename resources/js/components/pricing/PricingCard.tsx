import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PricingPackage } from '@/types/pricing';

interface PricingCardProps {
    package: PricingPackage;
    userPromptsRemaining: number;
    onSelectPackage: (pkg: PricingPackage) => void;
    isLoading?: boolean;
}

export function PricingCard({ package: pkg, userPromptsRemaining, onSelectPackage, isLoading = false }: PricingCardProps) {
    const canPurchase = true; // In a real app, you might have additional logic here

    return (
        <Card className={`flex flex-col border-2 ${pkg.is_popular ? 'border-primary shadow-lg' : 'border-border'}`}>
            <CardHeader className="flex flex-col space-y-1.5">
                {pkg.is_popular && (
                    <Badge className="w-fit mb-2" variant="default">
                        Most Popular
                    </Badge>
                )}
                <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                <CardDescription className="text-sm">{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold">{pkg.currency} {pkg.price.toLocaleString()}</span>
                </div>

                <div className="text-lg font-semibold mb-2">
                    {pkg.prompts_count.toLocaleString()} AI Prompts
                </div>

                <ul className="space-y-2 mt-4">
                    {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    size="lg"
                    variant={pkg.is_popular ? "default" : "outline"}
                    disabled={!canPurchase || isLoading}
                    onClick={() => onSelectPackage(pkg)}
                >
                    {isLoading ? 'Processing...' : 'Select Package'}
                </Button>
            </CardFooter>
        </Card>
    );
}
