// Define explicit route mappings
interface RouteMap {
    [key: string]: string;
}

const routes: RouteMap = {
    '/chat': './pages/Chat/ChatWrapper.tsx',
    // Add more route mappings as needed
};

export default routes;
