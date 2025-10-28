import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Users as UsersIcon, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  organization?: {
    name: string;
  };
  created_at: string;
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user?.id)
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

    loadUsers();
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(`
          id,
          role,
          organization_id,
          created_at,
          organization:organizations(name)
        `);

      if (usersError) throw usersError;

      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const authUserMap = new Map(authUsers.users.map(u => [u.id, u.email]));
      
      const combinedUsers = usersData?.map(u => ({
        ...u,
        email: authUserMap.get(u.id) || "N/A"
      })) || [];

      setUsers(combinedUsers as User[]);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      loadUsers();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "client_manager":
        return "bg-blue-100 text-blue-800";
      case "zone_supervisor":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage user roles and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.organization?.name || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(u.role)}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(newRole) => handleRoleChange(u.id, newRole)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="client_manager">Client Manager</SelectItem>
                          <SelectItem value="zone_supervisor">Zone Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
