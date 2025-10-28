
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account and application settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" disabled />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Change Password</Label>
              <div className="flex space-x-2 mt-2">
                <Input type="password" placeholder="Current Password" />
                <Input type="password" placeholder="New Password" />
              </div>
               <Button variant="outline" className="mt-2">Change Password</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Protect your account with an extra layer of security.
                </p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Manage your organization settings (Client Manager only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="Acme Corporation" />
            </div>
             <Button>Update Organization</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
