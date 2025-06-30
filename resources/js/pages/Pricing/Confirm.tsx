import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { PricingPackage, PurchaseRequest } from '@/types/pricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, ShoppingBag } from 'lucide-react';
import axios from 'axios';

interface ConfirmPageProps extends PageProps {
    package: PricingPackage;
}

export default function Confirm({ package: pkg }: ConfirmPageProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            const purchaseData: PurchaseRequest = {
                package_id: pkg.id,
                phone_number: phoneNumber,
            };

            // Here you would integrate with your existing M-Pesa flow
            // For now, we'll just call the API endpoint
            const response = await axios.post('/api/pricing/purchase', purchaseData);

            if (response.data.success) {
                router.visit('/pricing', {
                    onSuccess: () => {
                        // Show success message
                    }
                });
            } else {
                setError(response.data.error || 'Failed to process payment');
                setIsSubmitting(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred during payment');
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Confirm Purchase" />

            <div className="container max-w-4xl py-8">
                <Button
                    variant="ghost"
                    className="mb-8"
                    onClick={() => router.visit('/pricing')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Pricing
                </Button>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-4">Confirm Your Purchase</h1>
                        <p className="text-muted-foreground mb-6">
                            You're about to purchase the {pkg.name} package with {pkg.prompts_count} AI prompts.
                        </p>

                        <Card>
                            <CardHeader>
                                <CardTitle>Package Details</CardTitle>
                                <CardDescription>Review your selected package</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-medium">{pkg.name}</span>
                                    <span className="font-bold">{pkg.currency} {pkg.price.toLocaleString()}</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">{pkg.prompts_count} AI prompts</span>
                                    </div>
                                    {pkg.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-primary" />
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                                    <ShoppingBag className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-center">Payment Information</CardTitle>
                                <CardDescription className="text-center">
                                    Enter your M-Pesa phone number to complete payment
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">M-Pesa Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="e.g. 254712345678"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter your M-Pesa registered phone number
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="text-sm text-destructive">{error}</div>
                                    )}

                                    <CardFooter className="flex flex-col px-0">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting || !phoneNumber}
                                        >
                                            {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
