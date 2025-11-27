import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SponsorData {
  id?: string;
  name?: string;
  logo_url?: string;
  tier?: string;
  website_url?: string;
  display_order?: number;
}

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor?: SponsorData;
  onSuccess: () => void;
}

export function SponsorDialog({ open, onOpenChange, sponsor, onSuccess }: SponsorDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    tier: 'associate',
    website_url: '',
    display_order: 0
  });

  useEffect(() => {
    if (sponsor) {
      setFormData({
        name: sponsor.name || '',
        logo_url: sponsor.logo_url || '',
        tier: sponsor.tier || 'associate',
        website_url: sponsor.website_url || '',
        display_order: sponsor.display_order || 0
      });
    } else {
      setFormData({
        name: '',
        logo_url: '',
        tier: 'associate',
        website_url: '',
        display_order: 0
      });
    }
  }, [sponsor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (sponsor) {
        const { error } = await supabase
          .from('sponsors')
          .update(formData)
          .eq('id', sponsor.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Sponsor updated successfully' });
      } else {
        const { error } = await supabase
          .from('sponsors')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Sponsor added successfully' });
      }

      onSuccess();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ title: 'Error', description: err.message || 'Operation failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 border-red-600/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500 text-2xl">
            {sponsor ? 'Edit Sponsor' : 'Add Sponsor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Sponsor Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-black/40 border-red-600/30"
              required
            />
          </div>

          <div>
            <Label>Logo URL</Label>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="bg-black/40 border-red-600/30"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <Label>Tier</Label>
            <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
              <SelectTrigger className="bg-black/40 border-red-600/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-red-600/30">
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="associate">Associate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Website URL</Label>
            <Input
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="bg-black/40 border-red-600/30"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label>Display Order</Label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
              className="bg-black/40 border-red-600/30"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? 'Saving...' : (sponsor ? 'Update Sponsor' : 'Add Sponsor')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}