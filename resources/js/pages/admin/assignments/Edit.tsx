import React, { useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string | null;
    unit_name: string | null;
    group: {
        id: number;
        name: string;
    };
    created_by: {
        id: number;
        name: string;
    };
}

interface Props {
    assignment: Assignment;
}

const Edit = ({ assignment }: Props) => {
    const [values, setValues] = useState({
        title: assignment.title,
        description: assignment.description || '',
        due_date: assignment.due_date ? format(new Date(assignment.due_date), 'yyyy-MM-dd') : '',
        unit_name: assignment.unit_name || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Validate
        const newErrors: Record<string, string> = {};
        if (!values.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setProcessing(false);
            return;
        }

        router.put(route('admin.assignments.update', assignment.id), values, {
            onSuccess: () => {
                // Redirect happens automatically
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit Assignment: ${assignment.title}`} />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.assignments.show', assignment.id)}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold">Edit Assignment</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Assignment Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium mb-1">
                                        Title
                                    </label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={values.title}
                                        onChange={handleChange}
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                                        Description
                                    </label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={values.description}
                                        onChange={handleChange}
                                        rows={5}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="due_date" className="block text-sm font-medium mb-1">
                                            Due Date
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="due_date"
                                                name="due_date"
                                                type="date"
                                                value={values.due_date}
                                                onChange={handleChange}
                                                className={errors.due_date ? 'border-red-500' : ''}
                                            />
                                            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                        </div>
                                        {errors.due_date && (
                                            <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="unit_name" className="block text-sm font-medium mb-1">
                                            Unit Name
                                        </label>
                                        <Input
                                            id="unit_name"
                                            name="unit_name"
                                            value={values.unit_name}
                                            onChange={handleChange}
                                            className={errors.unit_name ? 'border-red-500' : ''}
                                        />
                                        {errors.unit_name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.unit_name}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        className="flex items-center gap-2"
                                        disabled={processing}
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Group</p>
                                <p className="font-medium">{assignment.group?.name || 'N/A'}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Created By</p>
                                <p className="font-medium">{assignment.created_by?.name || 'N/A'}</p>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm text-gray-500">
                                    Note: Editing this assignment will not affect the associated tasks.
                                    Tasks can be managed from the assignment view page.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Edit;
