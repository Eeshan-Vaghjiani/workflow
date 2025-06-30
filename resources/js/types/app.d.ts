import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { User } from './index';

declare global {
    export interface PageProps extends InertiaPageProps {
        auth: {
            user: User;
        };
    }
}

// Extend the User interface for AI pricing
declare module './index' {
    export interface User {
        ai_prompts_remaining?: number;
        is_paid_user?: boolean;
        last_payment_date?: string | null;
        total_prompts_purchased?: number;
    }
}

export {};
