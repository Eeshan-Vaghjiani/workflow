import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Loader2 } from 'lucide-react';

interface MpesaPaymentProps {
    title?: string;
    description?: string;
}

const MpesaPayment: React.FC<MpesaPaymentProps> = ({
    title = "M-Pesa Payment",
    description = "Enter your phone number to complete the payment"
}) => {
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [transactionId, setTransactionId] = useState<number | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [statusCheckCount, setStatusCheckCount] = useState<number>(0);

    useEffect(() => {
        // Fetch payment configuration (amount and logo URL)
        const fetchConfig = async () => {
            try {
                const response = await axios.get('/api/mpesa');
                setAmount(response.data.amount);
                setLogoUrl(response.data.logoUrl);
            } catch (err: any) {
                // Try the public endpoint
                try {
                    const publicResponse = await axios.get('/api/mpesa-public');
                    setAmount(publicResponse.data.amount);
                    setLogoUrl(publicResponse.data.logoUrl);
                } catch (publicErr: any) {
                    const errorMessage = err.response?.data?.message ||
                        err.message ||
                        'Failed to load payment configuration.';
                    setError(errorMessage);
                }
            }
        };

        fetchConfig();
    }, []);

    useEffect(() => {
        // Check payment status if we have a transaction ID
        if (transactionId) {
            const maxChecks = 12; // Check for about 60 seconds (12 * 5000ms)

            const statusInterval = setInterval(async () => {
                try {
                    const newCount = statusCheckCount + 1;
                    setStatusCheckCount(newCount);

                    const response = await axios.get(`/mpesa/status/${transactionId}`);
                    setPaymentStatus(response.data.status);

                    if (response.data.status === 'completed') {
                        setSuccess('Payment completed successfully!');
                        clearInterval(statusInterval);
                    } else if (response.data.status === 'failed') {
                        setError(`Payment failed: ${response.data.message || 'The payment was not completed'}`);
                        clearInterval(statusInterval);
                    } else if (newCount >= maxChecks) {
                        // After maxChecks with no completion, assume it was dismissed
                        // Also update the status in the database by calling a special endpoint
                        try {
                            await axios.post(`/mpesa/mark-dismissed/${transactionId}`);
                        } catch (err) {
                            // If the endpoint doesn't exist yet, that's fine
                            console.error('Could not mark transaction as dismissed:', err);
                        }

                        setError('Payment was not completed. The prompt may have been dismissed or timed out.');
                        setPaymentStatus('dismissed');
                        clearInterval(statusInterval);
                    }
                } catch (err) {
                    if (statusCheckCount >= maxChecks) {
                        try {
                            await axios.post(`/mpesa/mark-dismissed/${transactionId}`);
                        } catch (dismissErr) {
                            // If the endpoint doesn't exist yet, that's fine
                        }

                        setError('Payment was not completed. The prompt may have been dismissed or timed out.');
                        setPaymentStatus('dismissed');
                        clearInterval(statusInterval);
                    }
                }
            }, 5000); // Check every 5 seconds

            return () => clearInterval(statusInterval);
        }
    }, [transactionId, statusCheckCount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        setPaymentStatus(null);
        setStatusCheckCount(0);

        try {
            // Format phone number if needed
            let formattedPhone = phoneNumber;

            // Check if phone number starts with 0
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            }

            // Remove any spaces or special characters
            formattedPhone = formattedPhone.replace(/[^0-9]/g, '');

            const response = await axios.post('/mpesa/stk-push', {
                phone: formattedPhone
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setTransactionId(response.data.transaction_id);
                setPaymentStatus('pending');
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            // Extract error message from response if available
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to initiate payment. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const tryAgain = () => {
        setError(null);
        setSuccess(null);
        setPaymentStatus(null);
        setTransactionId(null);
        setStatusCheckCount(0);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Logo */}
                {logoUrl && (
                    <div className="flex justify-center mb-6">
                        <img
                            src={logoUrl}
                            alt="M-Pesa Logo"
                            className="h-20 object-contain"
                        />
                    </div>
                )}

                {/* Amount Display */}
                <div className="bg-muted p-4 rounded-md mb-6 text-center">
                    <div className="text-sm text-muted-foreground">Amount to Pay</div>
                    <div className="text-2xl font-bold">KES {amount.toLocaleString()}</div>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Payment Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && !error && paymentStatus !== 'failed' && (
                    <Alert className="mb-4">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {paymentStatus === 'pending' && (
                    <div className="space-y-4 mb-4">
                        <Alert>
                            <AlertTitle className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing Payment
                            </AlertTitle>
                            <AlertDescription>
                                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                            </AlertDescription>
                        </Alert>
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">{statusCheckCount}/12</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Phone Number Form */}
                {(!transactionId || paymentStatus === 'failed') && (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                                    Phone Number
                                </label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="e.g., 254712345678 or 0712345678"
                                    disabled={isLoading}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter your phone number starting with 254 or 0 (e.g., 254712345678 or 0712345678)
                                </p>
                            </div>
                        </div>
                        <div className="flex mt-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !phoneNumber}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay Now'
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Try Again Button */}
                {(paymentStatus === 'failed' && transactionId) && (
                    <div className="mt-4">
                        <Button
                            onClick={tryAgain}
                            variant="outline"
                            className="w-full"
                        >
                            Try Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MpesaPayment;
