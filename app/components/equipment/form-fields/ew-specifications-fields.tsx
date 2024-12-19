import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { ArrayField } from '../../../components/form/array-field';

export function EWSpecificationsFields() {
  const form = useFormContext();

  const renderArrayField = (label: string, path: string, placeholder: string) => (
    <ArrayField
      label={label}
      path={path}
      placeholder={placeholder}
    />
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>EW Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Operational Modes',
            'systemComponents.rfSpecifications.ewCapabilities.operationalModes',
            'Add operational mode'
          )}
          
          {renderArrayField(
            'Detection Frequencies',
            'systemComponents.rfSpecifications.ewCapabilities.frequencyCoverage.detection',
            'Add frequency range'
          )}
          
          {renderArrayField(
            'Jamming Frequencies',
            'systemComponents.rfSpecifications.ewCapabilities.frequencyCoverage.jamming',
            'Add jamming frequency range'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Signal Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderArrayField(
            'Capabilities',
            'systemComponents.rfSpecifications.ewCapabilities.signalProcessing.capabilities',
            'Add capability'
          )}
          
          {renderArrayField(
            'Modes',
            'systemComponents.rfSpecifications.ewCapabilities.signalProcessing.modes',
            'Add processing mode'
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antenna Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.ewCapabilities.antenna.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antenna Type</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter antenna type" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.ewCapabilities.antenna.gain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antenna Gain</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter antenna gain" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.ewCapabilities.antenna.coverage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coverage</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter coverage pattern" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensitivity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.ewCapabilities.sensitivity.min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Min sensitivity" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.ewCapabilities.sensitivity.max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Max sensitivity" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="systemComponents.rfSpecifications.ewCapabilities.sensitivity.unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., dBm" />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
} 