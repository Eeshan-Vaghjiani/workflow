import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    useEffect(() => {
        // Redirect to WorkOS login which handles both login and registration
        window.location.href = route('login');
    }, []);

    return (
        <>
            <Head title="Register" />
            <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0 bg-gray-100 dark:bg-gray-900">
                <div className="mt-6 w-full overflow-hidden bg-white dark:bg-gray-800 px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                    <div className="text-center">
                        <h2 className="text-xl font-bold dark:text-white">Redirecting to WorkOS...</h2>
                        <p className="mt-4 dark:text-gray-300">
                            Please wait while we redirect you to our secure authentication provider.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('login')}
                                className="rounded-md bg-gray-800 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Click here if you are not redirected automatically
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
