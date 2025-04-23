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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  RefreshCcw, 
  Edit, 
  Trash2,
  FileText
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function ModulesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newModule, setNewModule] = useState({ id: "", title: "", description: "", order: 0 });
  const { toast } = useToast();

  const { data: modules = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/modules"],
    queryFn: async () => {
      const response = await fetch("/api/admin/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return await response.json();
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create module");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setShowCreateModal(false);
      setNewModule({ id: "", title: "", description: "", order: 0 });
      toast({ title: "Modül oluşturuldu", description: "Yeni modül başarıyla oluşturuldu." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Modül oluşturulamadı", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await fetch(`/api/admin/modules/${moduleData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update module");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setIsEditModalOpen(false);
      toast({ title: "Modül güncellendi", description: "Modül bilgileri başarıyla güncellendi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Güncelleme başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete module");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/modules"] });
      setIsDeleteModalOpen(false);
      toast({ title: "Modül silindi", description: "Modül başarıyla silindi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Silme işlemi başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const filteredModules = modules.filter((module: any) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const moduleData = `${module.title} ${module.description || ""}`.toLowerCase();
    
    return searchTerms.every(term => moduleData.includes(term));
  });

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    createModuleMutation.mutate(newModule);
  };

  const handleEditModule = (module: any) => {
    setSelectedModule(module);
    setIsEditModalOpen(true);
  };

  const handleDeleteModule = (module: any) => {
    setSelectedModule(module);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateModule = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedModule) return;
    
    updateModuleMutation.mutate({
      id: selectedModule.id,
      title: selectedModule.title,
      description: selectedModule.description,
      order: selectedModule.order
    });
  };

  const confirmDeleteModule = () => {
    if (!selectedModule) return;
    deleteModuleMutation.mutate(selectedModule.id);
  };

  const viewModuleLessons = (moduleId: string) => {
    // Navigate to lessons view for this module
    window.location.href = `#lessons?moduleId=${moduleId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modül Yönetimi</h1>
          <p className="text-muted-foreground">
            Eğitim modüllerini oluşturun, düzenleyin ve yönetin.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Modül
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Modül ara..."
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
              <TableHead>Sıra</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Dersler</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Modüller yükleniyor...
                </TableCell>
              </TableRow>
            ) : filteredModules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Modül bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredModules.map((module: any) => (
                <TableRow key={module.id}>
                  <TableCell>{module.order}</TableCell>
                  <TableCell className="font-mono text-xs">{module.id}</TableCell>
                  <TableCell className="font-medium">{module.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{module.description || "-"}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => viewModuleLessons(module.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Dersleri Görüntüle
                    </Button>
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
                        <DropdownMenuItem onClick={() => handleEditModule(module)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteModule(module)} 
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

      {/* Create Module Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Modül Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir eğitim modülü oluşturmak için bilgileri doldurun.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateModule}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module-id" className="text-right">Modül ID</Label>
                <div className="col-span-3">
                  <Input 
                    id="module-id" 
                    value={newModule.id} 
                    onChange={(e) => setNewModule({ ...newModule, id: e.target.value })}
                    required
                    placeholder="Örn: module1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Benzersiz bir ID belirleyin, boşluk kullanmayın.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module-title" className="text-right">Başlık</Label>
                <div className="col-span-3">
                  <Input 
                    id="module-title" 
                    value={newModule.title} 
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    required
                    placeholder="Modül başlığı"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module-description" className="text-right">Açıklama</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="module-description" 
                    value={newModule.description} 
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    placeholder="Modül açıklaması"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module-order" className="text-right">Sıra</Label>
                <div className="col-span-3">
                  <Input 
                    id="module-order" 
                    type="number" 
                    min="1" 
                    value={newModule.order.toString()} 
                    onChange={(e) => setNewModule({ ...newModule, order: parseInt(e.target.value) || 0 })}
                    required
                    placeholder="Görüntülenme sırası"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Modülün görüntülenme sırası
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={createModuleMutation.isPending}
              >
                {createModuleMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Module Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modül Düzenle</DialogTitle>
            <DialogDescription>
              Modül bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateModule}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Modül ID</Label>
                <div className="col-span-3">
                  <Input 
                    value={selectedModule?.id || ""} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">Başlık</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit-title" 
                    value={selectedModule?.title || ""} 
                    onChange={(e) => setSelectedModule({ ...selectedModule, title: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Açıklama</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="edit-description" 
                    value={selectedModule?.description || ""} 
                    onChange={(e) => setSelectedModule({ ...selectedModule, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-order" className="text-right">Sıra</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit-order" 
                    type="number" 
                    min="1" 
                    value={selectedModule?.order?.toString() || "0"} 
                    onChange={(e) => setSelectedModule({ ...selectedModule, order: parseInt(e.target.value) || 0 })}
                    required
                  />
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
                disabled={updateModuleMutation.isPending}
              >
                {updateModuleMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modül Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Modülü silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">
              <strong>ID:</strong> {selectedModule?.id}
            </p>
            <p className="mb-2">
              <strong>Başlık:</strong> {selectedModule?.title}
            </p>
            <p className="text-destructive font-semibold text-center mt-4">
              Dikkat: Modülü silmeden önce içindeki tüm dersleri silmelisiniz.
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
              onClick={confirmDeleteModule}
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}