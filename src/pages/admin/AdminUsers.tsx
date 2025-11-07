import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Trash2, Shield, UserPlus, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type AppRole = 'admin' | 'store_manager' | 'production_manager' | 'sales_executive' | 'factory_staff' | 'customer';

const AdminUsers = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("customer");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all users from auth.users (via a function or direct query if RLS allows)
      // Note: This requires admin access to auth.users
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      // Get roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      // Map roles to users
      const usersWithRoles = (usersData?.users || []).map((user) => {
        const userRoles = (rolesData || [])
          .filter((r) => r.user_id === user.id)
          .map((r) => r.role as AppRole);
        
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          roles: userRoles,
        };
      });

      return usersWithRoles;
    },
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; role: AppRole }) => {
      // Create user via Supabase Auth Admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }
      if (!newUser?.user) throw new Error("User creation failed");

      // Assign role
      if (data.role !== 'customer') {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: newUser.user.id,
            role: data.role,
          });

        if (roleError) {
          console.error("Error assigning role:", roleError);
          // Try to delete the user if role assignment fails
          if (newUser?.user?.id) {
            await supabase.auth.admin.deleteUser(newUser.user.id);
          }
          throw roleError;
        }
      }

      return newUser.user;
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
      } catch (err: any) {
        throw new Error("Admin API requires service role key. Please configure VITE_SUPABASE_SERVICE_ROLE_KEY");
      }
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

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (role === 'customer') {
        // Remove all roles (customer is default, no role needed)
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Remove existing roles and add new one
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role,
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and assign roles
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
            {isLoading ? (
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

