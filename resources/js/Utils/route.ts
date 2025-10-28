// This file simply re-exports the global route function and provides 
// a current() helper for compatibility with different versions of Ziggy

// Interface for the Ziggy Router object returned by route()
interface ZiggyRouter {
    current: (name: string, params?: Record<string, unknown>) => boolean;
    has: (name: string) => boolean;
    url: string;
    params: Record<string, string>;
}

// Extend the Window interface to include the route function
declare global {
    interface Window {
        route: (name?: string, params?: Record<string, unknown> | string | number, absolute?: boolean) => unknown;
    }
}

// Re-export the global route function
export function route(name?: string, params?: Record<string, unknown> | string | number, absolute?: boolean): unknown {
    // Use the global route function
    if (name === undefined) {
        return window.route();
    }

    return window.route(name, params, absolute);
}

// Provide a current() helper
export function current(name: string, params?: Record<string, unknown>): boolean {
    // Check if the current route matches the specified name and params
    return (window.route() as ZiggyRouter).current(name, params);
}