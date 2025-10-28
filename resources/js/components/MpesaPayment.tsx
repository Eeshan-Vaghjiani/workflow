import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Loader2, PhoneIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';

// Add this line to ensure proper CSRF handling
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface MpesaPaymentProps {
    title?: string;
    description?: string;
}

const MpesaPayment: React.FC<MpesaPaymentProps> = ({
    title = "Pro Membership Payment",
    description = "Pay your Pro Membership fee via M-Pesa"
}) => {
    // State for managing the form and payment process
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
    const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
    const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState<number>(0);
    const [amount, setAmount] = useState<string>('1000'); // Default amount for Pro Membership

    // Effect to poll for payment status
    useEffect(() => {
        let intervalId: ReturnType<typeof setTimeout>;

        if (checkoutRequestId && !paymentCompleted && !paymentFailed && pollCount < 15) {
            // Poll every 5 seconds for up to 15 times (75 seconds total)
            intervalId = setInterval(() => {
                checkPaymentStatus();
                setPollCount(prev => prev + 1);
            }, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [checkoutRequestId, paymentCompleted, paymentFailed, pollCount]);

    // Function to check payment status
    const checkPaymentStatus = async () => {
        if (!checkoutRequestId) return;

        try {
            const response = await axios.post('/api/mpesa/check-status', {
                checkoutRequestId: checkoutRequestId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            const { status, message } = response.data;

            if (status === 'completed') {
                setPaymentCompleted(true);
                setStatusMessage('Payment completed successfully! Thank you for upgrading to Pro Membership.');
                clearPolling();
            } else if (status === 'failed') {
                setPaymentFailed(true);
                setStatusMessage(`Payment failed: ${message}`);
                clearPolling();
            } else {
                // Still pending, continue polling
                setStatusMessage('Waiting for payment confirmation...');
            }
        } catch (error) {
            // Only log the error, don't stop polling yet
            console.error('Error checking payment status:', error);

            // Check if we should stop polling after repeated errors
            if (pollCount > 10) {
                setPaymentFailed(true);
                setStatusMessage('Could not confirm payment status. Please check your M-Pesa app or contact support.');
                clearPolling();
            }
        }
    };

    // Clear polling state
    const clearPolling = () => {
        setPollCount(15); // This will stop the polling effect
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setIsError(false);
        setStatusMessage('');
        setPaymentCompleted(false);
        setPaymentFailed(false);
        setCheckoutRequestId(null);
        setPollCount(0);

        // Format phone number - ensure it starts with 254 (Kenya code)
        let formattedPhoneNumber = phoneNumber.trim();

        // Remove any non-digit characters
        formattedPhoneNumber = formattedPhoneNumber.replace(/\D/g, '');

        if (formattedPhoneNumber.startsWith('0')) {
            formattedPhoneNumber = '254' + formattedPhoneNumber.substring(1);
        } else if (formattedPhoneNumber.startsWith('+254')) {
            formattedPhoneNumber = formattedPhoneNumber.substring(1);
        } else if (!formattedPhoneNumber.startsWith('254')) {
            formattedPhoneNumber = '254' + formattedPhoneNumber;
        }

        // Validate the phone number format
        if (!/^254\d{9}$/.test(formattedPhoneNumber)) {
            setIsProcessing(false);
            setIsError(true);
            setStatusMessage('Please enter a valid Kenyan phone number');
            return;
        }

        // Call the M-Pesa API endpoint
        axios.post('/api/mpesa/stkpush', {
            phoneNumber: formattedPhoneNumber,
            amount: amount
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        })
            .then(response => {
                setIsProcessing(false);
                setIsSuccess(true);

                if (response.data.data && response.data.data.CheckoutRequestID) {
                    setCheckoutRequestId(response.data.data.CheckoutRequestID);
                }

                setStatusMessage('M-Pesa payment request sent successfully! Please check your phone to complete the payment.');
            })
            .catch(error => {
                setIsProcessing(false);
                setIsError(true);

                // Show more detailed error information
                const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate M-Pesa payment.';
                const errorDetails = error.response?.data?.error ? ` Details: ${error.response.data.error}` : '';
                setStatusMessage(`${errorMessage}${errorDetails} Please try again.`);
            });
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {!isSuccess ? (
                <Card className="border-border text-card-foreground">
                    <CardHeader>
                        <CardTitle className="text-center">{title}</CardTitle>
                        <CardDescription className="text-center">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {isError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircleIcon className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{statusMessage}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="phoneNumber" className="block text-sm font-medium">Phone Number</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                                        <PhoneIcon className="h-4 w-4" />
                                    </span>
                                    <Input
                                        id="phoneNumber"
                                        type="text"
                                        placeholder="e.g., 0712345678 or +254712345678"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        className="rounded-l-none"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter your phone number starting with 0 or 254 (e.g., 0712345678 or 254712345678)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="amount" className="block text-sm font-medium">Amount (KES)</label>
                                <Input
                                    id="amount"
                                    type="text"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    readOnly
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pro Membership Fee - 1000 KES
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay Pro Membership Fee'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                <Card className="border-border text-card-foreground">
                    <CardHeader>
                        <CardTitle className="text-center">Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert className={`mb-4 ${paymentCompleted
                            ? 'text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                            : paymentFailed
                                ? 'text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                                : 'text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                            }`}>
                            <AlertTitle>
                                {paymentCompleted
                                    ? 'Success!'
                                    : paymentFailed
                                        ? 'Failed!'
                                        : 'Processing...'}
                            </AlertTitle>
                            <AlertDescription>{statusMessage}</AlertDescription>
                        </Alert>

                        {!paymentCompleted && !paymentFailed && (
                            <div className="text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Waiting for your payment confirmation...
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    (This may take up to 1 minute)
                                </p>
                            </div>
                        )}

                        {(paymentCompleted || paymentFailed) && (
                            <div className="mt-4 flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setIsError(false);
                                        setPaymentCompleted(false);
                                        setPaymentFailed(false);
                                        setStatusMessage('');
                                    }}
                                >
                                    Try Again
                                </Button>
                                {paymentCompleted && (
                                    <Button onClick={() => window.location.href = '/dashboard'}>
                                        Go to Dashboard
                                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* M-Pesa Logo */}
            <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">Powered by</p>
                <img
                    src="/images/mpesa-logo.png"
                    alt="M-Pesa Logo"
                    className="h-8 mx-auto"
                />
            </div>
        </div>
    );
};

export default MpesaPayment;
