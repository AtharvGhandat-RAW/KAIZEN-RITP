import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Calendar,
  ArrowLeft,
  Save,
  Loader2,
  Star,
  Coffee,
  Trophy,
  Users,
  Sparkles,
  Mic,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ScheduleItem {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  day_number: number;
  item_type: string;
  venue: string | null;
  speakers: string[] | null;
  is_highlighted: boolean;
  sort_order: number;
  image_url?: string | null;
}

const ITEM_TYPES = [
  { value: 'ceremony', label: 'Ceremony', icon: Sparkles, color: 'bg-purple-500' },
  { value: 'event', label: 'Event', icon: Calendar, color: 'bg-blue-500' },
  { value: 'competition', label: 'Competition', icon: Trophy, color: 'bg-yellow-500' },
  { value: 'workshop', label: 'Workshop', icon: Users, color: 'bg-green-500' },
  { value: 'break', label: 'Break', icon: Coffee, color: 'bg-orange-500' },
  { value: 'activity', label: 'Activity', icon: Star, color: 'bg-pink-500' },
  { value: 'other', label: 'Other', icon: Mic, color: 'bg-gray-500' },
];

export default function ScheduleItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const defaultDay = parseInt(searchParams.get('day') || '1');

  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalDays, setTotalDays] = useState(3);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    day_number: defaultDay,
    item_type: 'event',
    venue: '',
    is_highlighted: false,
    sort_order: 0,
    image_url: '',
  });
  const [speakerInput, setSpeakerInput] = useState('');

  useEffect(() => {
    const fetchItem = async (itemId: string) => {
      try {
        const { data, error } = await supabase
          .from('schedule_items')
          .select('*')
          .eq('id', itemId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            title: data.title,
            description: data.description || '',
            start_time: data.start_time ? format(new Date(data.start_time), "yyyy-MM-dd'T'HH:mm") : '',
            end_time: data.end_time ? format(new Date(data.end_time), "yyyy-MM-dd'T'HH:mm") : '',
            day_number: data.day_number,
            item_type: data.item_type,
            venue: data.venue || '',
            is_highlighted: data.is_highlighted || false,
            sort_order: data.sort_order || 0,
            image_url: data.image_url || '',
          });
          if (data.speakers && data.speakers.length > 0) {
            setSpeakerInput(data.speakers.join(', '));
          }
        }
      } catch (error) {
        console.error('Error fetching item:', error);
        toast.error('Failed to load schedule item');
        navigate('/admin/schedule-builder');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing && id) {
      fetchItem(id);
    }
  }, [id, isEditing, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('schedule_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('schedule_images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.start_time) {
      toast.error('Start time is required');
      return;
    }

    setSaving(true);
    try {
      const speakers = speakerInput.split(',').map(s => s.trim()).filter(s => s);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        day_number: formData.day_number,
        item_type: formData.item_type,
        venue: formData.venue.trim() || null,
        speakers: speakers.length > 0 ? speakers : null,
        is_highlighted: formData.is_highlighted,
        sort_order: formData.sort_order,
        image_url: formData.image_url || null,
      };

      if (isEditing && id) {
        const { error } = await supabase
          .from('schedule_items')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        toast.success('Schedule item updated');
      } else {
        const { error } = await supabase
          .from('schedule_items')
          .insert(payload);

        if (error) throw error;
        toast.success('Schedule item created');
      }

      navigate('/admin/schedule-builder');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save schedule item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/schedule-builder')}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {isEditing ? 'Edit Schedule Item' : 'Add Schedule Item'}
              </h1>
              <p className="text-zinc-400 text-sm">
                {isEditing ? 'Update the details below' : 'Fill in the details for the new item'}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label className="text-white">Title <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Opening Ceremony"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Type & Day - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Type</Label>
                  <Select
                    value={formData.item_type}
                    onValueChange={(value) => setFormData({ ...formData, item_type: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 z-[99999]">
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Day</Label>
                  <Select
                    value={formData.day_number.toString()}
                    onValueChange={(value) => setFormData({ ...formData, day_number: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 z-[99999]">
                      {[...Array(totalDays)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white">
                          Day {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Start & End Time - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Start Time <span className="text-red-500">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">End Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              {/* Venue & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Venue</Label>
                  <Input
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g., Main Auditorium"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 1, 2, 3"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <p className="text-xs text-zinc-500">Lower numbers appear first (e.g., 1 is top)</p>
                </div>
              </div>

              {/* Speakers */}
              <div className="space-y-2">
                <Label className="text-white">Speakers / Hosts</Label>
                <Input
                  value={speakerInput}
                  onChange={(e) => setSpeakerInput(e.target.value)}
                  placeholder="Comma-separated: John Doe, Jane Smith"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
                <p className="text-xs text-zinc-500">Separate multiple names with commas</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this schedule item..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-white">Event Poster</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-0 right-0 p-1 bg-black/50 text-white hover:bg-red-600/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full h-20 px-4 transition bg-zinc-800 border-2 border-zinc-700 border-dashed rounded-lg appearance-none cursor-pointer hover:border-zinc-600 focus:outline-none"
                    >
                      <div className="flex flex-col items-center space-y-1">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-zinc-400" />
                        )}
                        <span className="font-medium text-zinc-400 text-xs">
                          {uploading ? 'Uploading...' : 'Click to upload image'}
                        </span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </Label>
                  </div>
                </div>
              </div>

              {/* Highlight */}
              <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <input
                  type="checkbox"
                  id="highlighted"
                  checked={formData.is_highlighted}
                  onChange={(e) => setFormData({ ...formData, is_highlighted: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-red-600 focus:ring-red-500 focus:ring-offset-zinc-900"
                />
                <div>
                  <Label htmlFor="highlighted" className="cursor-pointer text-white font-medium">
                    Highlight this item
                  </Label>
                  <p className="text-xs text-zinc-500">Featured events will be visually emphasized</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-zinc-800">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/schedule-builder')}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Item' : 'Create Item'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
