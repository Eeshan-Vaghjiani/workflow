interface ZiggyRouter {
    current: (name: string, params?: Record<string, unknown>) => boolean;
    has: (name: string) => boolean;
    url: string;
    params: Record<string, string>;
}

type RouteParamValue = string | number | Record<string, unknown>;

// Define the global route function
declare global {
    function route(): ZiggyRouter;
    function route(name: string, params?: RouteParamValue, absolute?: boolean): string;
} 