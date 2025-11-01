import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Check } from 'lucide-react';
import type { PricingPackage, PurchaseRequest } from '@/types/pricing';
import axios from 'axios';

interface PurchaseConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPackage: PricingPackage | null;
    onPurchaseComplete: () => void;
}

export function PurchaseConfirmationModal({
    open,
    onOpenChange,
    selectedPackage,
    onPurchaseComplete
}: PurchaseConfirmationModalProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPackage) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const purchaseData: PurchaseRequest = {
                package_id: selectedPackage.id,
                phone_number: phoneNumber,
            };

            // Here you would integrate with your existing M-Pesa flow
            // For now, we'll just call the API endpoint
            const response = await axios.post('/api/pricing/purchase', purchaseData);

            if (response.data.success) {
                onPurchaseComplete();
                onOpenChange(false);
            } else {
                setError(response.data.error || 'Failed to process payment');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred during payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!selectedPackage) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">Confirm Your Purchase</DialogTitle>
                    <DialogDescription className="text-center">
                        You're about to purchase the {selectedPackage.name} package
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="rounded-lg border p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-medium">{selectedPackage.name}</span>
                            <span className="font-bold">{selectedPackage.currency} {selectedPackage.price.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span className="text-sm">{selectedPackage.prompts_count} AI prompts</span>
                            </div>
                            {selectedPackage.features.slice(0, 3).map((feature, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-primary" />
                                    <span className="text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

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
                            Enter your M-Pesa registered phone number to complete payment
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-destructive">{error}</div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !phoneNumber}>
                            {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
