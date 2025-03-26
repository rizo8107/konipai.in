import { useState } from 'react';
import { testWebhookWithSampleData, testWebhookWithRealOrder } from '@/lib/webhookTest';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function WebhookTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runSampleTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const testResult = await testWebhookWithSampleData();
      setResult(testResult);
    } catch (err) {
      console.error('Error running test:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runRealOrderTest = async () => {
    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const testResult = await testWebhookWithRealOrder(orderId);
      setResult(testResult);
    } catch (err) {
      console.error('Error running test with real order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Webhook Testing Tool</h1>
      <p className="text-lg mb-8">Use this page to test the webhook functionality</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test with Sample Data</CardTitle>
            <CardDescription>
              Send test data to the webhook endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runSampleTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : 'Run Sample Test'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test with Real Order</CardTitle>
            <CardDescription>
              Send a real order's data to the webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter an order ID"
              />
            </div>
            <Button 
              onClick={runRealOrderTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : 'Run Real Order Test'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-600 font-medium">Error: {error}</p>
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {result.success ? 'Webhook test successful!' : 'Webhook test failed!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              className="font-mono text-sm h-96"
              value={JSON.stringify(result, null, 2)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 