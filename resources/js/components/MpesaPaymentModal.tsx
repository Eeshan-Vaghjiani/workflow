import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MpesaPayment from '@/components/MpesaPayment';

interface MpesaPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
    isOpen,
    onClose,
    title = "Make Payment with M-Pesa",
    description = "Upgrade to Pro Membership by paying via M-Pesa"
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <MpesaPayment
                        title="Student pro"
                        description={description}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MpesaPaymentModal;