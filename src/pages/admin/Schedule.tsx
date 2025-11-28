import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
}

export default function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    time: '',
    title: '',
    description: '',
    category: ''
  });

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('time');
      
      if (error) throw error;
      setSchedule(data || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('schedules')
          .update(formData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Schedule item updated');
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('Schedule item added');
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ time: '', title: '', description: '', category: '' });
      fetchSchedule();
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error('Failed to save schedule item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Schedule item deleted');
      fetchSchedule();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      time: item.time,
      title: item.title,
      description: item.description || '',
      category: item.category || ''
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Event Schedule</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setEditingItem(null);
                  setFormData({ time: '', title: '', description: '', category: '' });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-red-900/50 text-white">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                    className="bg-white/5 border-red-900/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event Title"
                    className="bg-white/5 border-red-900/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Workshop, Competition"
                    className="bg-white/5 border-red-900/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="bg-white/5 border-red-900/30"
                  />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  {editingItem ? 'Update' : 'Add'} Item
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-black/40 border-red-900/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" />
              Schedule Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-red-900/20 hover:bg-transparent">
                  <TableHead className="text-red-400">Time</TableHead>
                  <TableHead className="text-red-400">Title</TableHead>
                  <TableHead className="text-red-400">Category</TableHead>
                  <TableHead className="text-red-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/50 py-8">
                      Loading schedule...
                    </TableCell>
                  </TableRow>
                ) : schedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/50 py-8">
                      No schedule items found
                    </TableCell>
                  </TableRow>
                ) : (
                  schedule.map((item) => (
                    <TableRow key={item.id} className="border-red-900/20 hover:bg-red-950/10">
                      <TableCell className="text-white font-mono">{item.time}</TableCell>
                      <TableCell className="text-white">
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-white/50 mt-1">{item.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-white/70">{item.category}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
