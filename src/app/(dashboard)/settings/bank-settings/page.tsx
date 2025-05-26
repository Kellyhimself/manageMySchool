'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WebhookTest } from './webhook-test';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function BankSettingsPage() {
  const { school, isLoading: isSchoolLoading } = useAuth();
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    api_key: '',
    api_secret: '',
    api_endpoint: '',
    webhook_url: '',
    is_live: false
  });
  
  if (isSchoolLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6">Bank API Settings</h1>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6">Bank API Settings</h1>
          <div className="text-red-500">School not found</div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedBank) {
      toast.error('Please select a bank');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        school_id: school.id,
        bank_type: selectedBank,
        ...settings
      };
      console.log('Saving bank settings:', requestData);

      const response = await fetch('/api/schools/bank-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();
      console.log('Bank settings save response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save bank settings');
      }

      toast.success('Bank settings saved successfully');
    } catch (error) {
      console.error('Error saving bank settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save bank settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Bank API Settings</h1>

        <div className="grid gap-6 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Select Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBank}
                onValueChange={setSelectedBank}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kcb">KCB Bank</SelectItem>
                  <SelectItem value="equity">Equity Bank</SelectItem>
                  <SelectItem value="cooperative">Cooperative Bank</SelectItem>
                  <SelectItem value="im">I&M Bank</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedBank && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      value={settings.api_key}
                      onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Enter your API key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_secret">API Secret</Label>
                    <Input
                      id="api_secret"
                      type="password"
                      value={settings.api_secret}
                      onChange={(e) => setSettings(prev => ({ ...prev, api_secret: e.target.value }))}
                      placeholder="Enter your API secret"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_endpoint">API Endpoint</Label>
                    <Input
                      id="api_endpoint"
                      value={settings.api_endpoint}
                      onChange={(e) => setSettings(prev => ({ ...prev, api_endpoint: e.target.value }))}
                      placeholder="Enter API endpoint URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      value={settings.webhook_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, webhook_url: e.target.value }))}
                      placeholder="Enter webhook URL"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_live"
                      checked={settings.is_live}
                      onChange={(e) => setSettings(prev => ({ ...prev, is_live: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_live">Live Mode</Label>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhook Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebhookTest
                    schoolId={school.id}
                    bankType={selectedBank}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 