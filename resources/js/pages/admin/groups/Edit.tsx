import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import AdminLayout from '@/layouts/admin-layout';
import { Card3D } from '@/components/ui/card-3d';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';

// Interfaces
interface Group {
    id: number;
    name: string;
    description: string | null;
    is_public: boolean;
    owner: {
        name: string;
        email: string;
    };
}

interface GroupEditProps {
    group: Group;
}

// Animation Variants
const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

// Component
const GroupEdit: React.FC<GroupEditProps> = ({ group }) => {
    const [formData, setFormData] = useState({
        name: group.name,
        description: group.description || '',
        is_public: group.is_public,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_public: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.put(route('admin.groups.update', group.id), formData, {
            onSuccess: () => {
                setProcessing(false);
                router.visit(route('admin.groups.show', group.id));
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit Group: ${group.name}`} />
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[rgb(17,24,39)] dark:text-white">Edit Group</h1>
                        <p className="text-[rgb(75,85,99)] dark:text-[rgb(156,163,175)]">Update group details</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.visit(route('admin.groups.show', group.id))} variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />Back to Group
                        </Button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card3D className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Group Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_public"
                                        checked={formData.is_public}
                                        onCheckedChange={handleSwitchChange}
                                    />
                                    <Label htmlFor="is_public">Public Group</Label>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Group Owner</p>
                                    <p>{group.owner.name} ({group.owner.email})</p>
                                    <p className="text-xs text-gray-500 mt-1">To change the owner, please contact a system administrator.</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card3D>
                </motion.div>
            </motion.div>
        </AdminLayout>
    );
};

export default GroupEdit;
