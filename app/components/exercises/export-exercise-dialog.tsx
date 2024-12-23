import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportDialogProps {
  onExport: (additionalInfo: ExportAdditionalInfo) => void;
  exercise: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    location: string;
    totalCost: number;
    requiredDates: Array<{
      name: string;
      description: string;
      dueDate: string;
      type: string;
    }>;
    systems: Array<{
      system: {
        name: string;
        basePrice: number;
        leadTimes?: Array<{
          name: string;
          description: string;
          daysBeforeStart: number;
          type: string;
        }>;
      };
      quantity: number;
      fsrSupport: string;
      fsrCost: number;
      launchesPerDay?: number;
      consumablePresets: Array<{
        preset: {
          name: string;
          consumable?: {
            name: string;
            unit: string;
            currentUnitCost: number;
          };
        };
        quantity: number;
      }>;
    }>;
  };
}

interface ExportAdditionalInfo {
  classification: string;
  commandAuthority: string;
  exerciseCommander: string;
  missionObjective: string;
  additionalNotes: string;
}

export function ExportExerciseDialog({ onExport, exercise }: ExportDialogProps) {
  const [info, setInfo] = useState<ExportAdditionalInfo>({
    classification: "UNCLASSIFIED",
    commandAuthority: "",
    exerciseCommander: "",
    missionObjective: "",
    additionalNotes: ""
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onExport(info);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exercise Export Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Classification Level</label>
            <Input 
              value={info.classification}
              onChange={handleInputChange}
              name="classification"
              placeholder="UNCLASSIFIED"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Command Authority</label>
            <Input 
              value={info.commandAuthority}
              onChange={handleInputChange}
              name="commandAuthority"
              placeholder="e.g., USAF/ACC"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercise Commander</label>
            <Input 
              value={info.exerciseCommander}
              onChange={handleInputChange}
              name="exerciseCommander"
              placeholder="Name and Rank"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mission Objective</label>
            <Textarea 
              value={info.missionObjective}
              onChange={handleInputChange}
              name="missionObjective"
              placeholder="Brief description of exercise objectives"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes</label>
            <Textarea 
              value={info.additionalNotes}
              onChange={handleInputChange}
              name="additionalNotes"
              placeholder="Any additional information"
            />
          </div>
          <Button type="submit" className="w-full">Generate PDF</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 