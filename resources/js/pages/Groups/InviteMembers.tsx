import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Group {
    id: number;
    name: string;
}

interface Props {
    group: Group;
    errors: {
        user_id?: string;
        name?: string;
    };
}

export default function InviteMembers({ group, errors }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const { data, setData, post, processing } = useForm({
        user_id: '',
        is_leader: false,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Groups',
            href: '/groups',
        },
        {
            title: group.name,
            href: `/groups/${group.id}`,
        },
        {
            title: 'Invite Members',
            href: `/groups/${group.id}/invite`,
        },
    ];

    const handleSearch = async () => {
        if (searchTerm.length < 3) {
            setSearchError('Please enter at least 3 characters');
            return;
        }

        setSearching(true);
        setSearchError('');

        try {
            const response = await axios.get(`/groups/${group.id}/search-users`, {
                params: { name: searchTerm }
            });
            setSearchResults(response.data);
            if (response.data.length === 0) {
                setSearchError('No users found with that name');
            }
        } catch (error) {
            setSearchError('Error searching for users');
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const selectUser = (user: User) => {
        setData('user_id', user.id.toString());
        // Clear search results to show the selection
        setSearchResults([]);
        setSearchTerm(user.name);
    };

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('groups.members.store', group.id));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invite Members to ${group.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Invite Members to {group.name}</h1>
                    <p className="text-gray-500">Search for users by name to invite them to your group</p>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search by Name
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                id="name"
                                className="flex-1 px-3 py-2 border rounded-l-md shadow-sm focus:ring focus:ring-opacity-50 border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Enter name to search"
                                minLength={3}
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={searching}
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-r-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                            >
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        {searchError && <div className="text-red-500 text-sm mt-1">{searchError}</div>}
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Search Results</h3>
                            <div className="border dark:border-neutral-700 rounded-md overflow-hidden">
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border-b dark:border-neutral-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => selectUser(user)}
                                            className="px-3 py-1 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                        >
                                            Select
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.user_id && (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-2">Add User to Group</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">You've selected a user to add to {group.name}</p>
                                <div className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        id="is_leader"
                                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={data.is_leader}
                                        onChange={(e) => setData('is_leader', e.target.checked)}
                                    />
                                    <label htmlFor="is_leader" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Make this user a group leader
                                    </label>
                                </div>
                                {errors.user_id && <div className="text-red-500 text-sm mt-1">{errors.user_id}</div>}
                                <div className="flex justify-end">
                                    <a
                                        href={route('groups.show', group.id)}
                                        className="inline-flex items-center px-4 py-2 mr-3 border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50"
                                    >
                                        Cancel
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Add to Group
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 