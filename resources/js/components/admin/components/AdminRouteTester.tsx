import React from 'react';
import { Button } from '@/components/ui/button';

const AdminRouteTester: React.FC = () => {
    // Test if routes exist
    const testRoutes = () => {
        const routes = [
            'admin.groups.index',
            'admin.groups.show',
            'admin.groups.edit',
            'admin.groups.update',
            'admin.groups.destroy',
            'admin.groups.restore'
        ];

        const results: { route: string; exists: boolean }[] = [];

        routes.forEach(routeName => {
            try {
                // Try to generate a route URL
                const url = route(routeName, { group: 1 });
                results.push({ route: routeName, exists: true });
                console.log(`✅ Route ${routeName} exists: ${url}`);
            } catch (error) {
                results.push({ route: routeName, exists: false });
                console.error(`❌ Route ${routeName} does not exist:`, error);
            }
        });

        return results;
    };

    return (
        <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Admin Route Tester</h3>
            <Button onClick={testRoutes} variant="outline" size="sm">
                Test Routes
            </Button>
            <p className="mt-2 text-sm text-gray-500">Check the console for results</p>
        </div>
    );
};

export default AdminRouteTester;
