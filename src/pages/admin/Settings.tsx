import { useEffect, useState, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Settings as SettingsIcon,
  CheckCircle2,
  Globe,
  Loader2,
  AlertTriangle
} from 'lucide-react';

type SettingValue = string | boolean | number | null;

// Memoized input component - OUTSIDE the main component to prevent re-creation
const SettingInput = memo(({
  settingKey,
  label,
  placeholder,
  type = 'text',
  icon: Icon,
  hint,
  value,
  saving,
  onChange,
  onBlur
}: {
  settingKey: string;
  label: string;
  placeholder: string;
  type?: string;
  icon?: React.ElementType;
  hint?: string;
  value: string;
  saving: string | null;
  onChange: (key: string, value: string) => void;
  onBlur: (key: string, value: string) => void;
}) => (
  <div>
    <Label className="text-white/80 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4" />} {label}
      {saving === settingKey && <Loader2 className="w-3 h-3 animate-spin text-green-500" />}
    </Label>
    <Input
      type={type}
      defaultValue={value}
      onChange={(e) => onChange(settingKey, e.target.value)}
      onBlur={(e) => onBlur(settingKey, e.target.value)}
      className="bg-black/40 border-white/20 mt-1 focus:border-green-500"
      placeholder={placeholder}
    />
    {hint && <p className="text-white/40 text-xs mt-1">{hint}</p>}
  </div>
));

SettingInput.displayName = 'SettingInput';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        // Don't refetch if user is actively editing - prevents keyboard close
        if (!saving) {
          fetchSettings();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [saving]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const settingsMap: Record<string, SettingValue> = {};
      data.forEach((s: { key: string; value: string }) => {
        try {
          settingsMap[s.key] = JSON.parse(String(s.value));
        } catch {
          settingsMap[s.key] = s.value;
        }
      });
      setSettings(settingsMap);
      setSettingsLoaded(true);
    }
  };

  // Real-time save on blur
  const saveSetting = useCallback(async (key: string, value: SettingValue) => {
    setSaving(key);
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('key')
        .eq('key', key)
        .single();

      if (existing) {
        await supabase.from('settings').update({ value: JSON.stringify(value) }).eq('key', key);
      } else {
        await supabase.from('settings').insert({ key, value: JSON.stringify(value), category: 'general', description: '' });
      }

      // Update local state without triggering re-render that closes keyboard
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({ title: '✓ Saved', description: `${key.replace(/_/g, ' ')} updated` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  }, [toast]);

  const updateSetting = useCallback((key: string, value: SettingValue) => {
    // Don't update state on every keystroke - only track for blur save
    // This prevents re-renders that close the keyboard
  }, []);

  // For switches - save immediately
  const handleSwitchChange = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    saveSetting(key, value);
  }, [saveSetting]);

  // Handler for input blur - save the value
  const handleInputBlur = useCallback((key: string, value: string) => {
    saveSetting(key, value);
  }, [saveSetting]);

  // Handler for input change - no state update to prevent re-render
  const handleInputChange = useCallback((key: string, value: string) => {
    // Intentionally empty - we use defaultValue and save on blur
  }, []);

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-white/50 text-sm">Changes save automatically</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* System Status */}
            <Card className="bg-black/60 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-white">System Status</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-500/20">
                <div className="space-y-1">
                  <Label className="text-white font-medium">Maintenance Mode</Label>
                  <p className="text-white/50 text-sm">
                    Enable to show "Under Maintenance" page to all visitors. 
                    Admins can still access the dashboard.
                  </p>
                </div>
                <Switch
                  checked={Boolean(settings['maintenance_mode'])}
                  onCheckedChange={(checked) => handleSwitchChange('maintenance_mode', checked)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </Card>

            {/* Registration Control */}
            <Card className="bg-black/60 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-white">Registration</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-white text-base">Enable Registration</Label>
                    <p className="text-white/50 text-sm">Allow students to register for events</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving === 'registration_enabled' && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
                    <Switch
                      checked={Boolean(settings.registration_enabled)}
                      onCheckedChange={(checked) => handleSwitchChange('registration_enabled', checked)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Notice Banner</Label>
                  <Textarea
                    key={settingsLoaded ? 'loaded' : 'loading'}
                    defaultValue={String(settings.registration_notice || '')}
                    onBlur={(e) => saveSetting('registration_notice', e.target.value)}
                    className="bg-black/40 border-white/20 mt-1 focus:border-red-500"
                    rows={2}
                    placeholder="Registration closes on Feb 20th at 11:59 PM"
                  />
                  <p className="text-white/40 text-xs mt-1">Leave empty to hide</p>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="bg-black/60 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-white">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsLoaded && (
                  <>
                    <SettingInput
                      settingKey="contact_email"
                      label="Email"
                      placeholder="info@kaizen.edu"
                      type="email"
                      icon={Mail}
                      value={String(settings['contact_email'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="contact_phone"
                      label="Phone / WhatsApp"
                      placeholder="+91 98765 43210"
                      icon={Phone}
                      hint="Used for WhatsApp support button"
                      value={String(settings['contact_phone'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                    <div className="md:col-span-2">
                      <SettingInput
                        settingKey="contact_address"
                        label="Address"
                        placeholder="College Campus, City, State"
                        icon={MapPin}
                        value={String(settings['contact_address'] || '')}
                        saving={saving}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Social Media */}
            <Card className="bg-black/60 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Social Media</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsLoaded && (
                  <>
                    <SettingInput
                      settingKey="social_instagram"
                      label="Instagram"
                      placeholder="https://instagram.com/kaizen2025"
                      icon={Instagram}
                      value={String(settings['social_instagram'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_facebook"
                      label="Facebook"
                      placeholder="https://facebook.com/kaizen2025"
                      icon={Facebook}
                      value={String(settings['social_facebook'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_twitter"
                      label="Twitter / X"
                      placeholder="https://twitter.com/kaizen2025"
                      icon={Twitter}
                      value={String(settings['social_twitter'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_linkedin"
                      label="LinkedIn"
                      placeholder="https://linkedin.com/company/kaizen"
                      icon={Linkedin}
                      value={String(settings['social_linkedin'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_youtube"
                      label="YouTube"
                      placeholder="https://youtube.com/@kaizen2025"
                      icon={Youtube}
                      value={String(settings['social_youtube'] || '')}
                      saving={saving}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                    />
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm text-center">
              ✓ All changes are saved automatically when you click outside a field
            </p>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}