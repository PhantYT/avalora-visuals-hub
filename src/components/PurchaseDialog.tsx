import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  tiers: Array<{
    id: string;
    duration_type: string;
    price: number;
  }>;
}

export const PurchaseDialog = ({ open, onOpenChange, productName, tiers }: PurchaseDialogProps) => {
  const [selectedTier, setSelectedTier] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const { toast } = useToast();

  const getDurationLabel = (type: string) => {
    switch(type) {
      case 'week': return 'Неделя';
      case 'month': return 'Месяц';
      case 'lifetime': return 'Навсегда';
      default: return type;
    }
  };

  const handlePurchase = () => {
    if (!selectedTier || !paymentMethod) {
      toast({
        title: "Ошибка",
        description: "Выберите продолжительность и способ оплаты",
        variant: "destructive",
      });
      return;
    }

    const tier = tiers.find(t => t.id === selectedTier);
    const paymentLabel = paymentMethod === 'sbp' ? 'СБП' : 'Российская карта';
    
    toast({
      title: "Оформление покупки",
      description: `${productName} - ${getDurationLabel(tier!.duration_type)} за ${tier!.price}₽ через ${paymentLabel}`,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">{productName}</DialogTitle>
          <DialogDescription>
            Выберите продолжительность и способ оплаты
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Duration Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Продолжительность</Label>
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
              {tiers.map((tier) => (
                <div 
                  key={tier.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={tier.id} id={tier.id} />
                    <Label htmlFor={tier.id} className="cursor-pointer">
                      <div className="font-medium">{getDurationLabel(tier.duration_type)}</div>
                    </Label>
                  </div>
                  <div className="text-xl font-bold text-primary">{tier.price}₽</div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Способ оплаты</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div 
                className="flex items-center space-x-3 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => setPaymentMethod('sbp')}
              >
                <RadioGroupItem value="sbp" id="sbp" />
                <Label htmlFor="sbp" className="flex items-center gap-2 cursor-pointer">
                  <Smartphone className="w-5 h-5" />
                  <span>СБП (Система Быстрых Платежей)</span>
                </Label>
              </div>

              <div 
                className="flex items-center space-x-3 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => setPaymentMethod('ru_card')}
              >
                <RadioGroupItem value="ru_card" id="ru_card" />
                <Label htmlFor="ru_card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-5 h-5" />
                  <span>Российская карта (МИР)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 shadow-glow"
            onClick={handlePurchase}
          >
            Оплатить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
