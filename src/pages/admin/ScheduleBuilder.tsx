import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2,
  GripVertical,
  Star,
  Coffee,
  Trophy,
  Users,
  Sparkles,
  Mic
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

const emptyItem: Omit<ScheduleItem, 'id'> = {
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  day_number: 1,
  item_type: 'event',
  venue: '',
  speakers: [],
  is_highlighted: false,
  sort_order: 0,
};

export default function ScheduleBuilder() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState<Omit<ScheduleItem, 'id'>>(emptyItem);
  const [selectedDay, setSelectedDay] = useState(1);
  const [totalDays, setTotalDays] = useState(2);
  const [speakerInput, setSpeakerInput] = useState('');

  useEffect(() => {
    fetchScheduleItems();
    
    const channel = supabase
      .channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_items' }, () => {
        fetchScheduleItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchScheduleItems = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .order('day_number', { ascending: true })
        .order('start_time', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems((data as ScheduleItem[]) || []);
      
      // Calculate total days
      if (data && data.length > 0) {
        const maxDay = Math.max(...data.map((item: ScheduleItem) => item.day_number));
        setTotalDays(Math.max(maxDay, 2));
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: ScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        start_time: item.start_time ? format(new Date(item.start_time), "yyyy-MM-dd'T'HH:mm") : '',
        end_time: item.end_time ? format(new Date(item.end_time), "yyyy-MM-dd'T'HH:mm") : '',
        day_number: item.day_number,
        item_type: item.item_type,
        venue: item.venue || '',
        speakers: item.speakers || [],
        is_highlighted: item.is_highlighted,
        sort_order: item.sort_order,
      });
      setSpeakerInput((item.speakers || []).join(', '));
    } else {
      setEditingItem(null);
      setFormData({ ...emptyItem, day_number: selectedDay });
      setSpeakerInput('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.start_time) {
      toast.error('Title and start time are required');
      return;
    }

    setSaving(true);
    try {
      const speakers = speakerInput.split(',').map(s => s.trim()).filter(s => s);
      const payload = {
        ...formData,
        speakers: speakers.length > 0 ? speakers : null,
        end_time: formData.end_time || null,
        description: formData.description || null,
        venue: formData.venue || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('schedule_items')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Schedule item updated');
      } else {
        const { error } = await supabase
          .from('schedule_items')
          .insert(payload);

        if (error) throw error;
        toast.success('Schedule item created');
      }

      setDialogOpen(false);
      fetchScheduleItems();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save schedule item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item deleted');
      fetchScheduleItems();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete item');
    }
  };

  const getTypeInfo = (type: string) => {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[6];
  };

  const dayItems = items.filter(item => item.day_number === selectedDay);

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Schedule Builder</h1>
              <p className="text-zinc-400">Create the complete event timeline</p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Day Selector */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-zinc-400 text-sm">Select Day:</span>
            {[...Array(totalDays)].map((_, i) => (
              <Button
                key={i + 1}
                variant={selectedDay === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(i + 1)}
                className={selectedDay === i + 1 ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Day {i + 1}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTotalDays(prev => prev + 1)}
              className="text-zinc-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Timeline */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : dayItems.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Calendar className="w-16 h-16 text-zinc-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No items for Day {selectedDay}</h3>
                <p className="text-zinc-500 mb-4">Start building your schedule by adding items</p>
                <Button onClick={() => handleOpenDialog()} className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-red-500 to-red-600/20" />

              <div className="space-y-4">
                {dayItems.map((item, index) => {
                  const typeInfo = getTypeInfo(item.item_type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div key={item.id} className="relative pl-16 group">
                      {/* Timeline dot */}
                      <div className={`absolute left-4 w-5 h-5 rounded-full ${typeInfo.color} border-4 border-zinc-900 z-10 flex items-center justify-center`}>
                        {item.is_highlighted && (
                          <Star className="w-2 h-2 text-white fill-white" />
                        )}
                      </div>

                      {/* Time label */}
                      <div className="absolute left-0 -top-1 text-xs text-zinc-500 font-mono w-12 text-right pr-2 hidden sm:block">
                        {item.start_time && format(new Date(item.start_time), 'HH:mm')}
                      </div>

                      <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors ${item.is_highlighted ? 'ring-1 ring-yellow-500/50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge variant="outline" className={`${typeInfo.color} text-white border-none text-xs`}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                </Badge>
                                {item.is_highlighted && (
                                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Highlighted
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                {item.title}
                              </h3>

                              {item.description && (
                                <p className="text-zinc-400 text-sm mb-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {item.start_time && format(new Date(item.start_time), 'h:mm a')}
                                  {item.end_time && ` - ${format(new Date(item.end_time), 'h:mm a')}`}
                                </div>
                                {item.venue && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {item.venue}
                                  </div>
                                )}
                                {item.speakers && item.speakers.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Mic className="w-4 h-4" />
                                    {item.speakers.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(item)}
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add/Edit Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Opening Ceremony"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div>
                    <Label>Type</Label>
                    <Select
                      value={formData.item_type}
                      onValueChange={(value) => setFormData({ ...formData, item_type: value })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Day</Label>
                    <Select
                      value={formData.day_number.toString()}
                      onValueChange={(value) => setFormData({ ...formData, day_number: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {[...Array(totalDays)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Day {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Start Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_time || ''}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Venue</Label>
                    <Input
                      value={formData.venue || ''}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="e.g., Main Auditorium"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Speakers / Hosts (comma-separated)</Label>
                    <Input
                      value={speakerInput}
                      onChange={(e) => setSpeakerInput(e.target.value)}
                      placeholder="e.g., John Doe, Jane Smith"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this item..."
                      className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="highlighted"
                      checked={formData.is_highlighted}
                      onChange={(e) => setFormData({ ...formData, is_highlighted: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-500"
                    />
                    <Label htmlFor="highlighted" className="cursor-pointer">
                      Highlight this item (featured event)
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
