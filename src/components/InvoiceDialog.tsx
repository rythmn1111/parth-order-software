// components/InvoiceDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
}

export default function InvoiceDialog({
  isOpen,
  onClose,
  orderId,
  customerName,
}: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = async (sendWhatsApp: boolean = false) => {
    setLoading(true);

    try {
      // Use simple JSON request instead of FormData
      const response = await fetch('/api/invoice/generate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          sendWhatsApp
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDownloadUrl(result.invoicePath);
        
        toast({
          title: 'Success',
          description: sendWhatsApp 
            ? 'Invoice has been generated and sent via WhatsApp'
            : 'Invoice has been generated successfully',
        });

        if (result.warning) {
          toast({
            title: 'Warning',
            description: result.warning,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Successfully Placed</DialogTitle>
          <DialogDescription>
            Would you like to download or send the invoice for this order?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Order ID: <span className="font-medium text-foreground">{orderId}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Customer: <span className="font-medium text-foreground">{customerName}</span>
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {downloadUrl ? (
            <Button asChild className="w-full">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                Download Invoice
              </a>
            </Button>
          ) : (
            <Button 
              onClick={() => handleDownload(false)} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Invoice
            </Button>
          )}
          {/* <Button 
            onClick={() => handleDownload(true)} 
            disabled={loading}
            // variant="outline"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send via WhatsApp
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}