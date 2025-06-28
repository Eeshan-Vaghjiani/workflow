// Define explicit route mappings
interface RouteMap {
    [key: string]: string;
}

const routes: RouteMap = {
    '/chat': './pages/Chat/ChatWrapper.tsx',
    '/dashboard/calendar': './pages/Dashboard/Calendar.tsx',
    '/dashboard/gantt': './pages/Dashboard/Gantt.tsx',
    '/calendar': './pages/Calendar/Index.tsx',
    // Add more route mappings as needed
};

export default routes;
