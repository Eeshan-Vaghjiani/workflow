import { router } from '@inertiajs/react';

export function route(name: string, ...args: any[]): string {
    return router.visit(name, ...args).url;
}

export function current(name: string): boolean {
    return router.page.url === router.visit(name).url;
} 