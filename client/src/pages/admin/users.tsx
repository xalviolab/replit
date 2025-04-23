import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  UserPlus, 
  Search, 
  RefreshCcw, 
  Edit, 
  Trash2,
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json();
    }
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      const response = await fetch("/api/admin/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      return await response.json();
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditModalOpen(false);
      toast({ title: "Kullanıcı güncellendi", description: "Kullanıcı bilgileri başarıyla güncellendi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Güncelleme başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDeleteModalOpen(false);
      toast({ title: "Kullanıcı silindi", description: "Kullanıcı kaydı başarıyla silindi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Silme işlemi başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const filteredUsers = users.filter((user: any) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const userData = `${user.username} ${user.email} ${user.full_name || ""}`.toLowerCase();
    
    return searchTerms.every(term => userData.includes(term));
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      full_name: selectedUser.full_name,
      role_id: selectedUser.role_id,
      is_active: selectedUser.is_active
    });
  };

  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Platformdaki kullanıcıları yönetin ve düzenleyin.
          </p>
        </div>
        <Button size="sm" onClick={() => refetch()}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Kullanıcı ara..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Kullanıcı Adı</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Kullanıcılar yükleniyor...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Kullanıcı bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: any, index: number) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    {user.role_id === 1 ? (
                      <Badge variant="default" className="bg-warning">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Kullanıcı</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="default" className="bg-success">Aktif</Badge>
                    ) : (
                      <Badge variant="default" className="bg-destructive">Pasif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menüyü aç</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)} 
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini ve yetkilerini bu formdan düzenleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Kullanıcı Adı</Label>
                <div className="col-span-3">
                  <Input 
                    value={selectedUser?.username || ""} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">Ad Soyad</Label>
                <div className="col-span-3">
                  <Input 
                    id="full_name" 
                    value={selectedUser?.full_name || ""} 
                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Rol</Label>
                <div className="col-span-3">
                  <Select 
                    value={selectedUser?.role_id?.toString() || "2"} 
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role: any) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Durum</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch 
                    id="status" 
                    checked={selectedUser?.is_active} 
                    onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_active: checked })}
                  />
                  <Label htmlFor="status" className="cursor-pointer">
                    {selectedUser?.is_active ? "Aktif" : "Pasif"}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Kullanıcıyı silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-center text-destructive font-semibold">
              {selectedUser?.username} ({selectedUser?.email})
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}