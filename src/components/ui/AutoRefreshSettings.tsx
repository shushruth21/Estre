import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAutoRefreshSettings } from "@/hooks/useAutoRefreshSettings";
import { RefreshCw } from "lucide-react";

export function AutoRefreshSettings() {
  const { settings, updateSettings } = useAutoRefreshSettings();

  const intervalOptions = [
    { value: "10000", label: "10 seconds" },
    { value: "30000", label: "30 seconds" },
    { value: "60000", label: "1 minute" },
    { value: "120000", label: "2 minutes" },
    { value: "300000", label: "5 minutes" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Auto-Refresh Settings
        </CardTitle>
        <CardDescription>
          Control how frequently the application refreshes data automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-refresh-enabled">Enable Auto-Refresh</Label>
            <p className="text-sm text-muted-foreground">
              Automatically refresh data in the background
            </p>
          </div>
          <Switch
            id="auto-refresh-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="refresh-interval">Refresh Interval</Label>
          <Select
            value={settings.interval.toString()}
            onValueChange={(value) => updateSettings({ interval: parseInt(value) })}
            disabled={!settings.enabled}
          >
            <SelectTrigger id="refresh-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            How often to check for updates
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pause-on-inactive">Pause When Inactive</Label>
            <p className="text-sm text-muted-foreground">
              Stop refreshing when tab is not visible
            </p>
          </div>
          <Switch
            id="pause-on-inactive"
            checked={settings.pauseOnInactive}
            onCheckedChange={(pauseOnInactive) => updateSettings({ pauseOnInactive })}
            disabled={!settings.enabled}
          />
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            These settings help reduce network usage and improve battery life on mobile devices.
            Data will always be refreshed when you manually trigger an update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
