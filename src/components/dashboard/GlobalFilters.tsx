import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { activationService, ActivationOption } from "@/services/activationService";
import { zoneService, Zone } from "@/services/zoneService";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function GlobalFilters() {
  const { filters, updateFilters, clearFilters } = useGlobalFilters();
  const [activations, setActivations] = useState<ActivationOption[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivations();
  }, []);

  useEffect(() => {
    if (filters.activationId) {
      loadZones(filters.activationId);
    } else {
      setZones([]);
    }
  }, [filters.activationId]);

  const loadActivations = async () => {
    try {
      const data = await activationService.getActivationOptions();
      setActivations(data);
    } catch (error) {
      console.error("Failed to load activations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async (activationId: string) => {
    try {
      const data = await zoneService.getZonesByActivation(activationId);
      setZones(data);
    } catch (error) {
      console.error("Failed to load zones:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="dateFrom">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="dateTo">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="activation">Activation</Label>
          <Select
            value={filters.activationId || "all"}
            onValueChange={(value) =>
              updateFilters({ activationId: value === "all" ? undefined : value, zoneId: undefined })
            }
            disabled={loading}
          >
            <SelectTrigger id="activation">
              <SelectValue placeholder="All Activations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activations</SelectItem>
              {activations.map((activation) => (
                <SelectItem key={activation.id} value={activation.id}>
                  {activation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="zone">Zone</Label>
          <Select
            value={filters.zoneId || "all"}
            onValueChange={(value) =>
              updateFilters({ zoneId: value === "all" ? undefined : value })
            }
            disabled={!filters.activationId || zones.length === 0}
          >
            <SelectTrigger id="zone">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
