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
  AlertTriangle,
  Clock,
  Upload,
  ImageIcon,
  QrCode
} from 'lucide-react';
import { ImageCropper } from '@/components/admin/ImageCropper';

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
      onBlur={(e) => onBlur(settingKey, e.target.value)}
      className="bg-black/40 border-white/20 mt-1 focus:border-green-500 transition-colors duration-200"
      placeholder={placeholder}
    />
    {hint && <p className="text-white/40 text-xs mt-1">{hint}</p>}
  </div>
));

SettingInput.displayName = 'SettingInput';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;

      // Fetch Fest Settings
      const { data: festData } = await (supabase.from('fest_settings' as any) as any).select('*').single();

      if (data) {
        const settingsMap: Record<string, SettingValue> = {};
        const categoryMap: Record<string, string> = {};
        // Explicitly type 's' to match the expected structure from Supabase
        data.forEach((s: any) => {
          try {
            settingsMap[s.key] = JSON.parse(String(s.value));
          } catch {
            settingsMap[s.key] = s.value;
          }
          categoryMap[s.key] = s.category;
        });

        // Merge fest settings into the map with special keys
        if (festData) {
          settingsMap['fest_registration_live'] = festData.is_registration_live;

          // Convert UTC to local time for input display
          const toLocalISO = (dateStr: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
            return localISOTime;
          };

          settingsMap['fest_start_time'] = toLocalISO(festData.registration_start_time);
          settingsMap['fest_end_time'] = toLocalISO(festData.registration_end_time);
          settingsMap['global_button_action'] = festData.global_button_action || 'fest_registration';
        }

        setSettings(settingsMap);
        setCategories(categoryMap);
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    }
  };

  const updateFestSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const updateData: any = {};
      if (key === 'fest_registration_live') updateData.is_registration_live = value;

      // Convert local time input to UTC for storage
      if (key === 'fest_start_time' || key === 'fest_end_time') {
        const date = new Date(value);
        const utcISO = date.toISOString();
        if (key === 'fest_start_time') updateData.registration_start_time = utcISO;
        if (key === 'fest_end_time') updateData.registration_end_time = utcISO;
      }

      if (key === 'global_button_action') updateData.global_button_action = value;

      // Check if row exists, if not insert
      const { data: existing } = await (supabase.from('fest_settings' as any) as any).select('id').single();

      let error;
      if (existing) {
        const { error: updateError } = await (supabase
          .from('fest_settings' as any) as any)
          .update(updateData)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await (supabase
          .from('fest_settings' as any) as any)
          .insert(updateData);
        error = insertError;
      }

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast({
        title: 'Saved',
        description: 'Fest setting updated successfully',
        className: 'bg-green-500 text-white border-none',
      });
    } catch (error) {
      console.error('Error updating fest setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  // Real-time save on blur
  const saveSetting = useCallback(async (key: string, value: SettingValue) => {
    setSaving(key);
    try {
      // Optimistic update
      setSettings(prev => ({ ...prev, [key]: value }));

      // Use upsert for atomic insert/update - much faster
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          category: categories[key] || 'system',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      toast({ title: '✓ Saved', description: `${key.replace(/_/g, ' ')} updated` });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
      // Revert on error (optional, but good practice)
      fetchSettings();
    } finally {
      setSaving(null);
    }
  }, [toast]);

  // For switches - save immediately
  const handleSwitchChange = useCallback((key: string, value: boolean) => {
    saveSetting(key, value);
  }, [saveSetting]);

  // Handler for input blur - save the value (sanitize social links)
  const handleInputBlur = useCallback((key: string, value: string) => {
    let v = value;
    // For social links, ensure we store a full URL (default to https)
    if (key.startsWith('social_') && v && v !== '#') {
      if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v)) {
        v = `https://${v.replace(/^\/+/, '')}`;
      }
    }
    saveSetting(key, v);
  }, [saveSetting]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setCropperOpen(true);
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSaving('fest_qr_code_url');
    try {
      const fileExt = 'jpg';
      const fileName = `fest-qr-${generateUUID()}.${fileExt}`;
      const filePath = `upi-qr/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('events').getPublicUrl(filePath);

      await saveSetting('fest_qr_code_url', publicUrl);

      toast({ title: 'Success', description: 'QR code uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload the image',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

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
            {/* Fest Registration Settings */}
            <Card className="bg-black/60 border-red-600/30 p-5 xl:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-white">Fest Registration Control</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-purple-950/20 rounded-lg border border-purple-500/20">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">Fest Registration Live</Label>
                    <p className="text-white/50 text-sm">
                      Enable to allow users to register for the Fest (Step 1).
                    </p>
                  </div>
                  {settingsLoaded ? (
                    <Switch
                      checked={Boolean(settings['fest_registration_live'])}
                      onCheckedChange={(checked) => updateFestSetting('fest_registration_live', checked)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  ) : (
                    <div className="h-6 w-11 bg-white/5 animate-pulse rounded-full" />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Registration Start Time</Label>
                    {settingsLoaded ? (
                      <Input
                        type="datetime-local"
                        defaultValue={String(settings['fest_start_time'] || '').replace(/"/g, '')}
                        onBlur={(e) => updateFestSetting('fest_start_time', e.target.value)}
                        className="bg-black/40 border-white/20 mt-1 focus:border-purple-500"
                      />
                    ) : (
                      <div className="h-10 w-full bg-white/5 animate-pulse rounded mt-1" />
                    )}
                  </div>
                  <div>
                    <Label className="text-white/80">Registration End Time</Label>
                    {settingsLoaded ? (
                      <Input
                        type="datetime-local"
                        defaultValue={String(settings['fest_end_time'] || '').replace(/"/g, '')}
                        onBlur={(e) => updateFestSetting('fest_end_time', e.target.value)}
                        className="bg-black/40 border-white/20 mt-1 focus:border-purple-500"
                      />
                    ) : (
                      <div className="h-10 w-full bg-white/5 animate-pulse rounded mt-1" />
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Label className="text-white/80 mb-2 block">Global "Register" Button Action</Label>
                  <p className="text-white/40 text-xs mb-2">Controls where the main "Register Now" button takes the user.</p>
                  {settingsLoaded ? (
                    <select
                      value={String(settings['global_button_action'] || 'fest_registration')}
                      onChange={(e) => updateFestSetting('global_button_action', e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-md p-2 text-white focus:border-purple-500 outline-none"
                    >
                      <option value="fest_registration">Fest Registration Page (Step 1)</option>
                      <option value="event_registration">Event Registration Modal (Step 2)</option>
                    </select>
                  ) : (
                    <div className="h-10 w-full bg-white/5 animate-pulse rounded" />
                  )}
                </div>
              </div>
            </Card>

            {/* Event Countdown */}
            <Card className="bg-black/60 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-white">Event Countdown</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/80">Event Date & Time</Label>
                  {settingsLoaded ? (
                    <Input
                      type="datetime-local"
                      key="loaded-countdown"
                      defaultValue={String(settings['countdown_target'] || '').replace(/"/g, '')}
                      onBlur={(e) => saveSetting('countdown_target', e.target.value)}
                      className="bg-black/40 border-white/20 mt-1 focus:border-blue-500"
                    />
                  ) : (
                    <div className="h-10 w-full bg-white/5 animate-pulse rounded mt-1" />
                  )}
                  <p className="text-white/40 text-xs mt-1">This countdown is shown on the homepage</p>
                </div>

                <div>
                  <Label className="text-white/80">Event Date (Display Text)</Label>
                  {settingsLoaded ? (
                    <Input
                      type="text"
                      key="loaded-event-date"
                      defaultValue={String(settings['event_date'] || '').replace(/"/g, '')}
                      onBlur={(e) => saveSetting('event_date', e.target.value)}
                      className="bg-black/40 border-white/20 mt-1 focus:border-blue-500"
                      placeholder="e.g. March 15-16, 2026"
                    />
                  ) : (
                    <div className="h-10 w-full bg-white/5 animate-pulse rounded mt-1" />
                  )}
                  <p className="text-white/40 text-xs mt-1">This text is shown on the registration card</p>
                </div>
              </div>
            </Card>

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
                {settingsLoaded ? (
                  <Switch
                    checked={Boolean(settings['maintenance_mode'])}
                    onCheckedChange={(checked) => handleSwitchChange('maintenance_mode', checked)}
                    className="data-[state=checked]:bg-red-600"
                  />
                ) : (
                  <div className="h-6 w-11 bg-white/5 animate-pulse rounded-full" />
                )}
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
                    {settingsLoaded ? (
                      <Switch
                        checked={Boolean(settings.registration_enabled)}
                        onCheckedChange={(checked) => handleSwitchChange('registration_enabled', checked)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    ) : (
                      <div className="h-6 w-11 bg-white/5 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-white text-base">Enable Razorpay</Label>
                    <p className="text-white/50 text-sm">Toggle between Razorpay and Manual UPI/QR payment</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving === 'razorpay_enabled' && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
                    {settingsLoaded ? (
                      <Switch
                        checked={Boolean(settings.razorpay_enabled)}
                        onCheckedChange={(checked) => handleSwitchChange('razorpay_enabled', checked)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    ) : (
                      <div className="h-6 w-11 bg-white/5 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-white/80">Notice Banner</Label>
                  {settingsLoaded ? (
                    <Textarea
                      key="loaded-notice"
                      defaultValue={String(settings.registration_notice || '')}
                      onBlur={(e) => saveSetting('registration_notice', e.target.value)}
                      className="bg-black/40 border-white/20 mt-1 focus:border-red-500"
                      rows={2}
                      placeholder="Registration closes on Feb 20th at 11:59 PM"
                    />
                  ) : (
                    <div className="h-20 w-full bg-white/5 animate-pulse rounded mt-1" />
                  )}
                  <p className="text-white/40 text-xs mt-1">Leave empty to hide</p>
                </div>
              </div>
            </Card>

            {/* Payment Settings */}
            <Card className="bg-black/60 border-red-600/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-white">Payment Settings</h2>
              </div>

              <div className="space-y-6">
                <SettingInput
                  settingKey="fest_upi_id"
                  label="UPI ID"
                  placeholder="e.g. kaizen@upi"
                  value={String(settings['fest_upi_id'] || '')}
                  saving={saving}
                  onBlur={handleInputBlur}
                  hint="This UPI ID will be displayed on the Fest Registration page."
                />

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <Label className="text-white text-base">Enable Razorpay Test Mode</Label>
                    <p className="text-white/50 text-sm">When enabled, payments will be simulated for testing (no real Razorpay keys required).</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving === 'enable_razorpay_test' && <Loader2 className="w-4 h-4 animate-spin text-green-500" />}
                    {settingsLoaded ? (
                      <Switch
                        checked={Boolean(settings['enable_razorpay_test'])}
                        onCheckedChange={(checked) => handleSwitchChange('enable_razorpay_test', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    ) : (
                      <div className="h-6 w-11 bg-white/5 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-white/80 flex items-center gap-2 mb-2">
                    QR Code Image
                    {saving === 'fest_qr_code_url' && <Loader2 className="w-3 h-3 animate-spin text-green-500" />}
                  </Label>

                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 bg-black/40 border border-white/20 rounded-lg flex items-center justify-center overflow-hidden relative group">
                      {settings['fest_qr_code_url'] ? (
                        <img
                          src={String(settings['fest_qr_code_url'])}
                          alt="QR Code"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-white/20" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                          <Upload className="w-5 h-5 text-white" />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="bg-black/40 border-white/20 text-white/80 file:bg-white/10 file:text-white file:border-0 file:mr-4 file:px-4 file:py-2 hover:file:bg-white/20 cursor-pointer"
                        />
                      </div>
                      <p className="text-white/40 text-xs">
                        Upload the QR code image for payments. This will be displayed to students during registration.
                      </p>
                    </div>
                  </div>
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
                {settingsLoaded ? (
                  <>
                    <SettingInput
                      settingKey="contact_email"
                      label="Email"
                      placeholder="info@kaizen.edu"
                      type="email"
                      icon={Mail}
                      value={String(settings['contact_email'] || '')}
                      saving={saving}
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
                        onBlur={handleInputBlur}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded md:col-span-2" />
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
                {settingsLoaded ? (
                  <>
                    <SettingInput
                      settingKey="social_instagram"
                      label="Instagram"
                      placeholder="https://instagram.com/kaizen2026"
                      icon={Instagram}
                      value={String(settings['social_instagram'] || '')}
                      saving={saving}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_facebook"
                      label="Facebook"
                      placeholder="https://facebook.com/kaizen2026"
                      icon={Facebook}
                      value={String(settings['social_facebook'] || '')}
                      saving={saving}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_twitter"
                      label="Twitter / X"
                      placeholder="https://twitter.com/kaizen2026"
                      icon={Twitter}
                      value={String(settings['social_twitter'] || '')}
                      saving={saving}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_linkedin"
                      label="LinkedIn"
                      placeholder="https://linkedin.com/company/kaizen"
                      icon={Linkedin}
                      value={String(settings['social_linkedin'] || '')}
                      saving={saving}
                      onBlur={handleInputBlur}
                    />
                    <SettingInput
                      settingKey="social_youtube"
                      label="YouTube"
                      placeholder="https://youtube.com/@kaizen2026"
                      icon={Youtube}
                      value={String(settings['social_youtube'] || '')}
                      saving={saving}
                      onBlur={handleInputBlur}
                    />
                  </>
                ) : (
                  <>
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
                    <div className="h-16 w-full bg-white/5 animate-pulse rounded" />
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
        <ImageCropper
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      </AdminLayout>
    </ProtectedRoute>
  );
}