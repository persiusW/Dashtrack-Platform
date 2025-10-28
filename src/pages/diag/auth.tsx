
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DiagData {
  timestamp: string;
  env: {
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
    SUPABASE_SERVICE_ROLE_KEY: boolean;
    NODE_ENV: string;
  };
  session_present: boolean;
  user_present: boolean;
  user_id: string | null;
  user_email: string | null;
  whoami: any;
  whoamiErr: string | null;
  userOrgInfo: {
    organization_id: string;
    role: string;
  } | null;
  readOk: boolean;
  readErr: string | null;
  cookies_present: {
    sb_access_token: boolean;
    sb_refresh_token: boolean;
  };
}

export default function AuthDiagPage() {
  const [data, setData] = useState<DiagData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiag = () => {
    setLoading(true);
    setErr(null);
    fetch("/api/diag/auth")
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDiag();
  }, []);

  const StatusBadge = ({ condition, trueText = "OK", falseText = "FAIL" }: { condition: boolean; trueText?: string; falseText?: string }) => (
    <Badge variant={condition ? "default" : "destructive"} className="ml-2">
      {condition ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          {trueText}
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          {falseText}
        </>
      )}
    </Badge>
  );

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auth Doctor 🩺</h1>
          <p className="text-muted-foreground mt-1">
            Diagnose authentication and RLS issues
          </p>
        </div>
        <Button onClick={fetchDiag} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {err && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="w-5 h-5 mr-2" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-destructive overflow-auto">{err}</pre>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Check if required env vars are set</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
                <StatusBadge condition={data.env.NEXT_PUBLIC_SUPABASE_URL} trueText="SET" falseText="MISSING" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <StatusBadge condition={data.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} trueText="SET" falseText="MISSING" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</span>
                <StatusBadge condition={data.env.SUPABASE_SERVICE_ROLE_KEY} trueText="SET (Not Recommended)" falseText="NOT SET (Good)" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">NODE_ENV</span>
                <Badge variant="outline">{data.env.NODE_ENV}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Session Status */}
          <Card>
            <CardHeader>
              <CardTitle>Session & Authentication</CardTitle>
              <CardDescription>Current user session status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Session Present</span>
                <StatusBadge condition={data.session_present} trueText="YES" falseText="NO" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">User Present</span>
                <StatusBadge condition={data.user_present} trueText="YES" falseText="NO" />
              </div>
              {data.user_id && (
                <div className="pt-2 border-t">
                  <div className="text-sm space-y-1">
                    <div><span className="font-semibold">User ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{data.user_id}</code></div>
                    <div><span className="font-semibold">Email:</span> {data.user_email}</div>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="font-semibold mb-2">Cookies</div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">sb-access-token</span>
                    <StatusBadge condition={data.cookies_present.sb_access_token} trueText="PRESENT" falseText="MISSING" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">sb-refresh-token</span>
                    <StatusBadge condition={data.cookies_present.sb_refresh_token} trueText="PRESENT" falseText="MISSING" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Access */}
          <Card>
            <CardHeader>
              <CardTitle>Database Access</CardTitle>
              <CardDescription>RLS and query permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Organizations Table Read</span>
                <StatusBadge condition={data.readOk} />
              </div>
              {data.readErr && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  <span className="font-semibold">Error:</span> {data.readErr}
                </div>
              )}
              {data.userOrgInfo && (
                <div className="pt-2 border-t">
                  <div className="font-semibold mb-2">User Organization Info</div>
                  <div className="text-sm space-y-1">
                    <div><span className="font-semibold">Organization ID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{data.userOrgInfo.organization_id}</code></div>
                    <div><span className="font-semibold">Role:</span> <Badge variant="outline">{data.userOrgInfo.role}</Badge></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* whoami() Function */}
          <Card>
            <CardHeader>
              <CardTitle>whoami() Function</CardTitle>
              <CardDescription>SQL function diagnostic output</CardDescription>
            </CardHeader>
            <CardContent>
              {data.whoamiErr ? (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  <span className="font-semibold">Error:</span> {data.whoamiErr}
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(data.whoami, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Raw JSON */}
          <Card>
            <CardHeader>
              <CardTitle>Full Diagnostic Data</CardTitle>
              <CardDescription>Complete JSON response</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Help Text */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-sm">💡 Debugging Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>No session?</strong> Check if user is logged in at <code className="bg-muted px-1 rounded">/</code></p>
              <p>• <strong>RLS errors?</strong> Verify policies allow the current user&apos;s organization_id</p>
              <p>• <strong>Missing cookies?</strong> Open DevTools → Application → Cookies and verify Supabase session cookies exist</p>
              <p>• <strong>JWT claims empty?</strong> Check if the auth hook is properly setting organization_id in the JWT</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
