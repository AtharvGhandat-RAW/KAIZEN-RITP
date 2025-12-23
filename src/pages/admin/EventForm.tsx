import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Save,
    Calendar,
    MapPin,
    Users,
    IndianRupee,
    Upload,
    Loader2,
    ImageIcon,
} from 'lucide-react';

// UUID fallback
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

interface FormData {
    name: string;
    category: string;
    description: string;
    venue: string;
    event_date: string;
    registration_deadline: string;
    registration_start_date: string;
    registration_end_date: string;
    registration_fee: number;
    max_participants: number;
    min_team_size: number;
    max_team_size: number;
    event_type: string;
    status: string;
    upi_qr_url: string;
}

export default function EventForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        category: 'Tech',
        description: '',
        venue: '',
        event_date: '',
        registration_deadline: '',
        registration_start_date: '',
        registration_end_date: '',
        registration_fee: 0,
        max_participants: 0,
        min_team_size: 1,
        max_team_size: 1,
        event_type: 'individual',
        status: 'upcoming',
        upi_qr_url: '',
    });

    useEffect(() => {
        const loadEvent = async (eventId: string) => {
            setFetching(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error) {
                toast({
                    title: 'Error',
                    description: 'Event not found',
                    variant: 'destructive',
                });
                navigate('/admin/events');
                return;
            }

            if (data) {
                // Cast data to any to handle new columns not yet in types
                const eventData = data as any;
                setFormData({
                    name: eventData.name || '',
                    category: eventData.category || 'Tech',
                    description: eventData.description || '',
                    venue: eventData.venue || '',
                    event_date: eventData.event_date?.split('T')[0] || '',
                    registration_deadline: eventData.registration_deadline?.split('T')[0] || '',
                    registration_start_date: eventData.registration_start_date?.split('T')[0] || '',
                    registration_end_date: eventData.registration_end_date?.split('T')[0] || '',
                    registration_fee: eventData.registration_fee || 0,
                    max_participants: eventData.max_participants || 0,
                    min_team_size: eventData.min_team_size || 1,
                    max_team_size: eventData.max_team_size || 1,
                    event_type: eventData.event_type || 'individual',
                    status: eventData.status || 'upcoming',
                    upi_qr_url: eventData.upi_qr_url || '',
                });
            }
        };

        if (isEdit && id) {
            loadEvent(id);
        }
    }, [id, isEdit, navigate, toast]);

    const handleInputChange = (field: keyof FormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file',
                description: 'Please upload an image file',
                variant: 'destructive',
            });
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${generateUUID()}.${fileExt}`;
            const filePath = `upi-qr/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('events')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('events').getPublicUrl(filePath);

            setFormData((prev) => ({ ...prev, upi_qr_url: publicUrl }));
            toast({ title: 'Success', description: 'QR code uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload failed',
                description: 'Could not upload the image',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.venue || !formData.event_date) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const eventData = {
                name: formData.name,
                category: formData.category,
                description: formData.description,
                venue: formData.venue,
                event_date: formData.event_date,
                registration_deadline: formData.registration_deadline || formData.event_date,
                registration_fee: Number(formData.registration_fee),
                max_participants: Number(formData.max_participants),
                min_team_size: Number(formData.min_team_size),
                max_team_size: Number(formData.max_team_size),
                event_type: formData.event_type,
                status: formData.status,
                upi_qr_url: formData.upi_qr_url || null,
            };

            if (isEdit && id) {
                const { error } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', id);

                if (error) throw error;
                toast({ title: 'Success', description: 'Event updated successfully' });
            } else {
                const { error } = await supabase.from('events').insert([eventData]);

                if (error) throw error;
                toast({ title: 'Success', description: 'Event created successfully' });
            }

            navigate('/admin/events');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast({
                title: 'Error',
                description: err.message || 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <ProtectedRoute requiredRoles={['super_admin', 'event_manager']}>
                <AdminLayout>
                    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRoles={['super_admin', 'event_manager']}>
            <AdminLayout>
                <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/events')}
                            className="text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {isEdit ? 'Edit Event' : 'Create New Event'}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {isEdit ? 'Update event details' : 'Add a new event to KAIZEN'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <Card className="bg-black/40 border-red-600/30">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-red-500" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">
                                            Event Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Enter event name"
                                            className="bg-black/40 border-gray-700"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => handleInputChange('category', value)}
                                        >
                                            <SelectTrigger className="bg-black/40 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tech">Tech</SelectItem>
                                                <SelectItem value="Cultural">Cultural</SelectItem>
                                                <SelectItem value="Sports">Sports</SelectItem>
                                                <SelectItem value="Gaming">Gaming</SelectItem>
                                                <SelectItem value="Workshop">Workshop</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-300">Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Event description..."
                                        className="bg-black/40 border-gray-700 min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location & Time */}
                        <Card className="bg-black/40 border-red-600/30">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                    Location & Time
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">
                                        Venue <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={formData.venue}
                                        onChange={(e) => handleInputChange('venue', e.target.value)}
                                        placeholder="Event venue"
                                        className="bg-black/40 border-gray-700"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">
                                            Event Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.event_date}
                                            onChange={(e) => handleInputChange('event_date', e.target.value)}
                                            className="bg-black/40 border-gray-700"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Registration Deadline</Label>
                                        <Input
                                            type="date"
                                            value={formData.registration_deadline}
                                            onChange={(e) =>
                                                handleInputChange('registration_deadline', e.target.value)
                                            }
                                            className="bg-black/40 border-gray-700"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Registration Start Date</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.registration_start_date}
                                            onChange={(e) => handleInputChange('registration_start_date', e.target.value)}
                                            className="bg-black/40 border-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Registration End Date</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.registration_end_date}
                                            onChange={(e) => handleInputChange('registration_end_date', e.target.value)}
                                            className="bg-black/40 border-gray-700"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleInputChange('status', value)}
                                    >
                                        <SelectTrigger className="bg-black/40 border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="ongoing">Ongoing</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Participants & Pricing */}
                        <Card className="bg-black/40 border-red-600/30">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-red-500" />
                                    Participants & Pricing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Event Type</Label>
                                        <Select
                                            value={formData.event_type}
                                            onValueChange={(value) => handleInputChange('event_type', value)}
                                        >
                                            <SelectTrigger className="bg-black/40 border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="individual">Individual</SelectItem>
                                                <SelectItem value="team">Team</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Max Participants</Label>
                                        <Input
                                            type="number"
                                            value={formData.max_participants}
                                            onChange={(e) =>
                                                handleInputChange('max_participants', parseInt(e.target.value) || 0)
                                            }
                                            className="bg-black/40 border-gray-700"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {formData.event_type === 'team' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Min Team Size</Label>
                                            <Input
                                                type="number"
                                                value={formData.min_team_size}
                                                onChange={(e) =>
                                                    handleInputChange('min_team_size', parseInt(e.target.value) || 1)
                                                }
                                                className="bg-black/40 border-gray-700"
                                                min="1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Max Team Size</Label>
                                            <Input
                                                type="number"
                                                value={formData.max_team_size}
                                                onChange={(e) =>
                                                    handleInputChange('max_team_size', parseInt(e.target.value) || 1)
                                                }
                                                className="bg-black/40 border-gray-700"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-gray-300 flex items-center gap-2">
                                        <IndianRupee className="w-4 h-4" />
                                        Registration Fee
                                    </Label>
                                    <Input
                                        type="number"
                                        value={formData.registration_fee}
                                        onChange={(e) =>
                                            handleInputChange('registration_fee', parseInt(e.target.value) || 0)
                                        }
                                        className="bg-black/40 border-gray-700"
                                        min="0"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* UPI QR Code */}
                        <Card className="bg-black/40 border-red-600/30">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-red-500" />
                                    Payment QR Code
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">UPI QR Code Image</Label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="bg-black/40 border-gray-700"
                                                disabled={uploading}
                                            />
                                        </div>
                                        {uploading && (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </div>
                                        )}
                                    </div>
                                    {formData.upi_qr_url && (
                                        <div className="mt-4">
                                            <img
                                                src={formData.upi_qr_url}
                                                alt="UPI QR Code"
                                                className="w-32 h-32 object-contain rounded-lg border border-gray-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/admin/events')}
                                className="border-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-red-600 hover:bg-red-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isEdit ? 'Update Event' : 'Create Event'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
}
