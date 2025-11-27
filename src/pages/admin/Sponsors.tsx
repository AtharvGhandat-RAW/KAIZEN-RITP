import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { SponsorDialog } from '@/components/admin/SponsorDialog';
import { useToast } from '@/hooks/use-toast';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  tier: string;
  website_url: string | null;
  is_visible: boolean;
  display_order: number;
}

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSponsors();

    const channel = supabase
      .channel('sponsors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => {
        fetchSponsors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSponsors = async () => {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) setSponsors(data);
  };

  const toggleVisibility = async (sponsor: Sponsor) => {
    const { error } = await supabase
      .from('sponsors')
      .update({ is_visible: !sponsor.is_visible })
      .eq('id', sponsor.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return;

    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Sponsor deleted successfully' });
    }
  };

  const tierColors = {
    title: 'border-yellow-500/50 bg-yellow-600/10',
    gold: 'border-yellow-600/50 bg-yellow-700/10',
    silver: 'border-gray-400/50 bg-gray-500/10',
    associate: 'border-blue-500/50 bg-blue-600/10'
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-red-500" style={{
              textShadow: '0 0 20px rgba(255, 69, 0, 0.5)'
            }}>
              Sponsors Management
            </h1>
            <Button
              onClick={() => {
                setSelectedSponsor(null);
                setDialogOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Sponsor
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className={`bg-black/40 border-2 ${tierColors[sponsor.tier as keyof typeof tierColors]} p-4 sm:p-6 rounded-lg`}
              >
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{sponsor.name}</h3>
                    <span className="px-3 py-1 bg-black/40 text-white/90 text-sm rounded uppercase">
                      {sponsor.tier}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleVisibility(sponsor)}
                      className="text-yellow-500 hover:bg-yellow-600/10"
                    >
                      {sponsor.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSponsor(sponsor);
                        setDialogOpen(true);
                      }}
                      className="text-blue-500 hover:bg-blue-600/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteSponsor(sponsor.id)}
                      className="text-red-500 hover:bg-red-600/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {sponsor.logo_url && (
                  <div className="mb-4 bg-white/5 rounded p-4 flex items-center justify-center h-32">
                    <img src={sponsor.logo_url} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                  </div>
                )}

                {sponsor.website_url && (
                  <a
                    href={sponsor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            ))}
          </div>

          {sponsors.length === 0 && (
            <p className="text-white/60 text-center py-8">No sponsors yet</p>
          )}

          <SponsorDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            sponsor={selectedSponsor}
            onSuccess={() => {
              setDialogOpen(false);
              fetchSponsors();
            }}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}