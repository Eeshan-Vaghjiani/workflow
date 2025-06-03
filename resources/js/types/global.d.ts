import type { route as routeFn } from 'ziggy-js';
import { AxiosStatic } from 'axios';

interface ZiggyRouter {
    current: (name: string, params?: Record<string, unknown>) => boolean;
    has: (name: string) => boolean;
    url: string;
    params: Record<string, string>;
}

type RouteParamValue = string | number | Record<string, unknown>;

declare global {
    const route: typeof routeFn;
    // Global route function type
    function route(): ZiggyRouter;
    function route(name: string, params?: RouteParamValue, absolute?: boolean): string;
}

interface Window {
    getCsrfToken: () => string | null;
    refreshCsrfToken: () => Promise<boolean>;
    axios: AxiosStatic;
    Echo: unknown;
    Pusher: unknown;
}
