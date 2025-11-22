import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, isServiceRoleConfigured } from "@/integrations/supabase/adminClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Shield, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AppRole = 'admin' | 'store_manager' | 'production_manager' | 'sales_executive' | 'factory_staff' | 'customer';

interface User {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  roles: AppRole[];
}

const AdminUsers = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("customer");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles using admin client or fallback to profiles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Use admin client to list all users if service role is configured
      if (isServiceRoleConfigured && supabaseAdmin) {
        try {
          const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (listError) {
            console.error("Error listing users:", listError);
            throw listError;
          }

          if (authUsers && authUsers.length > 0) {
            // Get profiles for all users
            const userIds = authUsers.map((u) => u.id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, role")
              .in("user_id", userIds);

            const profileMap = new Map(
              (profiles || []).map((p: any) => [p.user_id, p.role])
            );

            // Map auth users to User interface
            return authUsers.map((user) => ({
              id: user.id,
              email: user.email || `user-${user.id.slice(0, 8)}`,
              created_at: user.created_at,
              email_confirmed_at: user.email_confirmed_at,
              roles: profileMap.has(user.id) ? [profileMap.get(user.id) as AppRole] : ['customer' as AppRole],
            })) as User[];
          }
        } catch (e) {
          console.error("Error fetching users with admin client:", e);
          // Fall through to profiles fallback
        }
      }

      // Fallback: Fetch profiles and try to get user info
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Map profiles to User interface
      // Note: Without admin client, we can't get email for all users
      return (profiles || []).map((profile: any) => ({
        id: profile.user_id,
        email: profile.full_name || `User ${profile.user_id.slice(0, 8)}`, // Fallback
        created_at: profile.created_at,
        email_confirmed_at: null,
        roles: [profile.role] as AppRole[],
      })) as User[];
    },
    retry: false,
  });

  // Create new user mutation using admin client
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; role: AppRole }) => {
      if (!isServiceRoleConfigured || !supabaseAdmin) {
        throw new Error("Service role key not configured. Cannot create users.");
      }

      // Create user using admin client
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
      });

      if (createError || !createData.user) {
        throw new Error(createError?.message || "Failed to create user");
      }

      // Create profile with role
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: createData.user.id,
          role: userData.role,
          full_name: userData.email.split("@")[0], // Use email prefix as name
        }, {
          onConflict: "user_id",
        });

      if (profileError && profileError.code !== "23505") {
        console.error("Error creating profile:", profileError);
        // Continue anyway - user is created, profile can be fixed later
      }

      return { user: createData.user };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("customer");
      toast({
        title: "User Created",
        description: "User has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating User",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation using admin client
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!isServiceRoleConfigured || !supabaseAdmin) {
        throw new Error("Service role key not configured. Cannot delete users.");
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(error.message || "Failed to delete user");
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting User",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Assign role mutation - update profiles table
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Update profile role
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              role,
            })
            .select()
            .single();

          if (createError) {
            throw new Error(createError.message || "Failed to create profile");
          }

          return newProfile;
        }

        throw new Error(error.message || "Failed to update role");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] }); // Invalidate auth context
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Role",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    await createUserMutation.mutateAsync({
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
    });
    setIsCreating(false);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }
    await deleteUserMutation.mutateAsync(userId);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    await assignRoleMutation.mutateAsync({ userId, role: newRole });
  };

  const adminApiAvailable = isServiceRoleConfigured;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {!adminApiAvailable && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Service role key required</AlertTitle>
            <AlertDescription>
              Creating or deleting users requires configuring <code>VITE_SUPABASE_SERVICE_ROLE_KEY</code> with your Supabase service role key.
              This key should only be used in trusted admin environments.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and assign roles
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!adminApiAvailable}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new user account and assign a role
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={(value) => setNewUserRole(value as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="store_manager">Store Manager</SelectItem>
                      <SelectItem value="production_manager">Production Manager</SelectItem>
                      <SelectItem value="sales_executive">Sales Executive</SelectItem>
                      <SelectItem value="factory_staff">Factory Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage all user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!adminApiAvailable ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p>Configure the Supabase service role key to view and manage users from the admin portal.</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                                >
                                  <Shield className="h-3 w-3" />
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">Customer</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.email_confirmed_at ? (
                            <span className="text-green-600 text-sm">Confirmed</span>
                          ) : (
                            <span className="text-yellow-600 text-sm">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={user.roles[0] || "customer"}
                              onValueChange={(value) =>
                                handleRoleChange(user.id, value as AppRole)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="store_manager">Store Manager</SelectItem>
                                <SelectItem value="production_manager">Production Manager</SelectItem>
                                <SelectItem value="sales_executive">Sales Executive</SelectItem>
                                <SelectItem value="factory_staff">Factory Staff</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

