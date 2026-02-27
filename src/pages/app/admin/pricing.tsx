import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, RefreshCw, CreditCard } from "lucide-react";

type PlatformSetting = {
    id: string;
    tier_name: string;
    plan_key: string;
    price_ghc: number;
    max_campaigns: number;
    max_locations_per_campaign: number;
    features: string[];
};

export default function AdminPricingPage() {
    const { user, isLoading: authLoading, supabase } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [settings, setSettings] = useState<PlatformSetting[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            checkAdminAccess(user.id);
        }
    }, [user]);

    const checkAdminAccess = async (userId: string) => {
        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();

        if (userData?.role !== "admin") {
            toast({
                title: "Access Denied",
                description: "You do not have permission to access this page",
                variant: "destructive",
            });
            router.push("/app/overview");
            return;
        }

        loadSettings();
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("platform_settings" as any)
                .select("*")
                .order("price_ghc", { ascending: true });

            if (error) {
                // If the table doesn't exist yet, it means migrations haven't run
                if (error.code === '42P01') {
                    console.warn("platform_settings table not found. Migrations pending.");
                    setSettings([]);
                    return;
                }
                throw error;
            }

            setSettings(data as unknown as PlatformSetting[]);
        } catch (error) {
            console.error("Failed to load pricing settings:", error);
            toast({
                title: "Error",
                description: "Failed to load pricing settings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (index: number, field: keyof PlatformSetting, value: any) => {
        const newSettings = [...settings];
        newSettings[index] = { ...newSettings[index], [field]: value };
        setSettings(newSettings);
    };

    const saveSetting = async (setting: PlatformSetting) => {
        try {
            setSaving(setting.id);
            const { error } = await supabase
                .from("platform_settings" as any)
                .update({
                    price_ghc: setting.price_ghc,
                    max_campaigns: setting.max_campaigns,
                    max_locations_per_campaign: setting.max_locations_per_campaign,
                })
                .eq("id", setting.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: `${setting.tier_name} plan updated successfully.`,
            });
        } catch (error) {
            console.error("Failed to update plan:", error);
            toast({
                title: "Error",
                description: "Failed to update plan settings",
                variant: "destructive",
            });
        } finally {
            setSaving(null);
        }
    };

    if (authLoading || !user || loading) {
        return (
            <AppLayout variant="simple">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading settings...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout variant="simple">
            <div className="container mx-auto p-4 md:p-6 space-y-6 flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pricing & Plans</h1>
                        <p className="text-muted-foreground mt-1">Manage subscription tiers and system limitations</p>
                    </div>
                    <Button onClick={loadSettings} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {settings.length === 0 ? (
                    <Card className="mt-6 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No Pricing Tiers Found</h3>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                The platform_settings table seems to be empty or tracking hasn't been initialized yet.
                                Ensure your database migrations are applied.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
                        {settings.map((setting, index) => (
                            <Card key={setting.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{setting.tier_name}</CardTitle>
                                    <CardDescription>Plan ID: {setting.plan_key}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <div className="space-y-2">
                                        <Label htmlFor={`price-${setting.id}`}>Price (GHC) / mo</Label>
                                        <Input
                                            id={`price-${setting.id}`}
                                            type="number"
                                            value={setting.price_ghc}
                                            onChange={(e) => handleSettingChange(index, 'price_ghc', parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`campaigns-${setting.id}`}>Max Campaigns</Label>
                                        <Input
                                            id={`campaigns-${setting.id}`}
                                            type="number"
                                            value={setting.max_campaigns}
                                            onChange={(e) => handleSettingChange(index, 'max_campaigns', parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`locations-${setting.id}`}>Max Locations per Campaign</Label>
                                        <Input
                                            id={`locations-${setting.id}`}
                                            type="number"
                                            value={setting.max_locations_per_campaign}
                                            onChange={(e) => handleSettingChange(index, 'max_locations_per_campaign', parseInt(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-xs text-muted-foreground">Included Features (UI Only):</Label>
                                        <ul className="text-sm space-y-1 mt-2 list-disc pl-4 text-muted-foreground">
                                            {setting.features?.map((f, i) => (
                                                <li key={i}>{f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t">
                                    <Button
                                        className="w-full"
                                        onClick={() => saveSetting(setting)}
                                        disabled={saving === setting.id}
                                    >
                                        {saving === setting.id ? (
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        {saving === setting.id ? "Saving..." : "Save Changes"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
