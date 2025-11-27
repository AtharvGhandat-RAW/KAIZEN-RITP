import { useEffect, useState } from 'react';
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
  CreditCard,
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

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    }
  };

  // Real-time save on blur
  const saveSetting = async (key: string, value: SettingValue) => {
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

      toast({ title: '✓ Saved', description: `${key.replace(/_/g, ' ')} updated` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const updateSetting = (key: string, value: SettingValue) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // For switches - save immediately
  const handleSwitchChange = (key: string, value: boolean) => {
    updateSetting(key, value);
    saveSetting(key, value);
  };

  // Input field with auto-save on blur
  const SettingInput = ({
    settingKey,
    label,
    placeholder,
    type = 'text',
    icon: Icon,
    hint
  }: {
    settingKey: string;
    label: string;
    placeholder: string;
    type?: string;
    icon?: React.ElementType;
    hint?: string;
  }) => (
    <div>
      <Label className="text-white/80 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />} {label}
        {saving === settingKey && <Loader2 className="w-3 h-3 animate-spin text-green-500" />}
      </Label>
      <Input
        type={type}
        value={String(settings[settingKey] || '')}
        onChange={(e) => updateSetting(settingKey, e.target.value)}
        onBlur={(e) => saveSetting(settingKey, e.target.value)}
        className="bg-black/40 border-white/20 mt-1 focus:border-green-500"
        placeholder={placeholder}
      />
      {hint && <p className="text-white/40 text-xs mt-1">{hint}</p>}
    </div>
  );

  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AdminLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-white/50 text-sm">Changes save automatically</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* System Status */}
            <Card className="bg-black/40 border-red-600/30 p-5">
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

            {/* Contact Information */}
            <Card className="bg-black/40 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-white">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingInput
                  settingKey="contact_email"
                  label="Email"
                  placeholder="info@kaizen.edu"
                  type="email"
                  icon={Mail}
                />
                <SettingInput
                  settingKey="contact_phone"
                  label="Phone / WhatsApp"
                  placeholder="+91 98765 43210"
                  icon={Phone}
                  hint="Used for WhatsApp support button"
                />
                <div className="md:col-span-2">
                  <SettingInput
                    settingKey="contact_address"
                    label="Address"
                    placeholder="College Campus, City, State"
                    icon={MapPin}
                  />
                </div>
              </div>
            </Card>

            {/* Social Media */}
            <Card className="bg-black/40 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Social Media</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingInput
                  settingKey="social_instagram"
                  label="Instagram"
                  placeholder="https://instagram.com/kaizen2025"
                  icon={Instagram}
                />
                <SettingInput
                  settingKey="social_facebook"
                  label="Facebook"
                  placeholder="https://facebook.com/kaizen2025"
                  icon={Facebook}
                />
                <SettingInput
                  settingKey="social_twitter"
                  label="Twitter / X"
                  placeholder="https://twitter.com/kaizen2025"
                  icon={Twitter}
                />
                <SettingInput
                  settingKey="social_linkedin"
                  label="LinkedIn"
                  placeholder="https://linkedin.com/company/kaizen"
                  icon={Linkedin}
                />
                <SettingInput
                  settingKey="social_youtube"
                  label="YouTube"
                  placeholder="https://youtube.com/@kaizen2025"
                  icon={Youtube}
                />
              </div>
            </Card>

            {/* Registration Control */}
            <Card className="bg-black/40 border-red-600/30 p-5">
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
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Notice Banner</Label>
                  <Textarea
                    value={String(settings.registration_notice || '')}
                    onChange={(e) => updateSetting('registration_notice', e.target.value)}
                    onBlur={(e) => saveSetting('registration_notice', e.target.value)}
                    className="bg-black/40 border-white/20 mt-1"
                    rows={2}
                    placeholder="Registration closes on Feb 20th at 11:59 PM"
                  />
                  <p className="text-white/40 text-xs mt-1">Leave empty to hide</p>
                </div>
              </div>
            </Card>

            {/* Payment */}
            <Card className="bg-black/40 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-white">Payment Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingInput
                  settingKey="payment_upi_id"
                  label="UPI ID"
                  placeholder="kaizen@ybl"
                />
                <SettingInput
                  settingKey="payment_account_name"
                  label="Account Name"
                  placeholder="KAIZEN 2025"
                />
                <div className="md:col-span-2">
                  <Label className="text-white/80">Payment Instructions</Label>
                  <Textarea
                    value={String(settings.payment_instructions || '')}
                    onChange={(e) => updateSetting('payment_instructions', e.target.value)}
                    onBlur={(e) => saveSetting('payment_instructions', e.target.value)}
                    className="bg-black/40 border-white/20 mt-1"
                    rows={3}
                    placeholder="1. Pay using UPI&#10;2. Screenshot payment&#10;3. Upload during registration"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-white">Require Payment Screenshot</Label>
                    <p className="text-white/50 text-sm">Students must upload proof</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving === 'payment_screenshot_required' && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
                    <Switch
                      checked={settings.payment_screenshot_required !== false}
                      onCheckedChange={(checked) => handleSwitchChange('payment_screenshot_required', checked)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Info */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm text-center">
                ✓ All changes are saved automatically when you click outside a field
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}