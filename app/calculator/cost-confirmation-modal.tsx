import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

interface CostConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  fieldName: string;
  systemName: string;
  currentValue: number | null;
}

export function CostConfirmationModal({
  open,
  onClose,
  onConfirm,
  fieldName,
  systemName,
  currentValue
}: CostConfirmationModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const value = parseFloat((form.elements.namedItem('value') as HTMLInputElement).value);
    onConfirm(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Cost Value</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <p>Please confirm the {fieldName} for {systemName}:</p>
            <Input 
              type="number"
              name="value"
              defaultValue={currentValue || 0}
              min="0"
              step="0.01"
            />
            <p className="text-sm text-muted-foreground">
              Enter 0 to confirm if this cost truly is zero.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 