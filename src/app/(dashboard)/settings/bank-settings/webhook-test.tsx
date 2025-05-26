'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

interface WebhookTestProps {
  schoolId: string;
  bankType: string;
}

export function WebhookTest({ schoolId, bankType }: WebhookTestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    amount: 1000,
    reference: 'TEST-fde5f8e2-e775-4670-a621-efac5e233b1d-' + Date.now().toString().slice(-6),
    status: 'success'
  });

  const handleTestWebhook = async () => {
    if (!schoolId || !bankType) {
      toast.error('School ID and Bank Type are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-school-id': schoolId,
          'x-bank-type': bankType
        },
        body: JSON.stringify({
          amount: testData.amount,
          reference: testData.reference,
          status: testData.status,
          timestamp: new Date().toISOString(),
          transaction_id: 'TEST-' + Date.now(),
          signature: 'test-signature'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test webhook');
      }

      toast.success('Webhook test successful');
      console.log('Webhook test response:', data);
    } catch (error) {
      console.error('Webhook test error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to test webhook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Test Webhook</h3>
      
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={testData.amount}
          onChange={(e) => setTestData(prev => ({ ...prev, amount: Number(e.target.value) }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <Input
          id="reference"
          value={testData.reference}
          onChange={(e) => setTestData(prev => ({ ...prev, reference: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={testData.status}
          onValueChange={(value) => setTestData(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleTestWebhook}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Testing...' : 'Test Webhook'}
      </Button>

      <div className="text-sm text-gray-500">
        <p>Bank Type: {bankType}</p>
        <p>School ID: {schoolId}</p>
      </div>
    </div>
  );
} 