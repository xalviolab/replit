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
import { Textarea } from "@/components/ui/textarea";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  RefreshCcw, 
  Edit, 
  Trash2,
  Award
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function BadgesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    image_url: "",
    criteria: JSON.stringify({
      type: "lessons_completed",
      count: 5
    }, null, 2)
  });
  const { toast } = useToast();

  const { data: badges = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/badges"],
    queryFn: async () => {
      const response = await fetch("/api/admin/badges");
      if (!response.ok) throw new Error("Failed to fetch badges");
      return await response.json();
    }
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: any) => {
      // Parse criteria if it's a string
      const dataToSend = {
        ...badgeData,
        criteria: typeof badgeData.criteria === 'string' 
          ? JSON.parse(badgeData.criteria) 
          : badgeData.criteria
      };
      
      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create badge");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setShowCreateModal(false);
      setNewBadge({
        name: "",
        description: "",
        image_url: "",
        criteria: JSON.stringify({
          type: "lessons_completed",
          count: 5
        }, null, 2)
      });
      toast({ title: "Rozet oluşturuldu", description: "Yeni rozet başarıyla oluşturuldu." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Rozet oluşturulamadı", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateBadgeMutation = useMutation({
    mutationFn: async (badgeData: any) => {
      // Parse criteria if it's a string
      const dataToSend = {
        ...badgeData,
        criteria: typeof badgeData.criteria === 'string' 
          ? JSON.parse(badgeData.criteria) 
          : badgeData.criteria
      };
      
      const response = await fetch(`/api/admin/badges/${badgeData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update badge");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setIsEditModalOpen(false);
      toast({ title: "Rozet güncellendi", description: "Rozet bilgileri başarıyla güncellendi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Güncelleme başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (badgeId: number) => {
      const response = await fetch(`/api/admin/badges/${badgeId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete badge");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/badges"] });
      setIsDeleteModalOpen(false);
      toast({ title: "Rozet silindi", description: "Rozet başarıyla silindi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Silme işlemi başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const filteredBadges = badges.filter((badge: any) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const badgeData = `${badge.name} ${badge.description || ""}`.toLowerCase();
    
    return searchTerms.every(term => badgeData.includes(term));
  });

  const handleCreateBadge = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate JSON
      JSON.parse(newBadge.criteria);
      createBadgeMutation.mutate(newBadge);
    } catch (error) {
      toast({ 
        title: "Geçersiz kriter formatı", 
        description: "Kriter alanı geçerli bir JSON formatında olmalıdır.", 
        variant: "destructive" 
      });
    }
  };

  const handleEditBadge = (badge: any) => {
    // Format criteria as a string for editing
    setSelectedBadge({
      ...badge,
      criteria: typeof badge.criteria === 'string' 
        ? badge.criteria 
        : JSON.stringify(badge.criteria, null, 2)
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteBadge = (badge: any) => {
    setSelectedBadge(badge);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateBadge = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBadge) return;
    
    try {
      // Validate JSON
      if (typeof selectedBadge.criteria === 'string') {
        JSON.parse(selectedBadge.criteria);
      }
      
      updateBadgeMutation.mutate({
        id: selectedBadge.id,
        name: selectedBadge.name,
        description: selectedBadge.description,
        image_url: selectedBadge.image_url,
        criteria: selectedBadge.criteria
      });
    } catch (error) {
      toast({ 
        title: "Geçersiz kriter formatı", 
        description: "Kriter alanı geçerli bir JSON formatında olmalıdır.", 
        variant: "destructive" 
      });
    }
  };

  const confirmDeleteBadge = () => {
    if (!selectedBadge) return;
    deleteBadgeMutation.mutate(selectedBadge.id);
  };

  const renderBadgeImage = (url: string) => {
    if (!url) return "-";
    
    return (
      <div className="relative w-10 h-10 overflow-hidden rounded-md">
        <img 
          src={url} 
          alt="Badge" 
          className="w-full h-full object-cover" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-badge.svg';
          }}
        />
      </div>
    );
  };

  const renderCriteria = (criteria: any) => {
    let criteriaObj;
    
    try {
      criteriaObj = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
    } catch (error) {
      return <span className="text-destructive">Geçersiz JSON</span>;
    }
    
    // Simple display for common criteria types
    switch (criteriaObj.type) {
      case "lessons_completed":
        return `${criteriaObj.count} ders tamamlama`;
      case "points":
        return `${criteriaObj.count} puan kazanma`;
      case "streak":
        return `${criteriaObj.count} günlük çalışma serisi`;
      case "perfect_score":
        return `${criteriaObj.count} mükemmel skor`;
      case "specific_module":
        return `Belirli bir modülü tamamlama (${criteriaObj.module_id})`;
      default:
        return JSON.stringify(criteriaObj).substring(0, 40) + "...";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rozet Yönetimi</h1>
          <p className="text-muted-foreground">
            Kullanıcıların kazanabileceği rozetleri oluşturun ve düzenleyin.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Rozet
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rozet ara..."
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
              <TableHead>ID</TableHead>
              <TableHead>Görsel</TableHead>
              <TableHead>Ad</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Kazanma Kriteri</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Rozetler yükleniyor...
                </TableCell>
              </TableRow>
            ) : filteredBadges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Rozet bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredBadges.map((badge: any) => (
                <TableRow key={badge.id}>
                  <TableCell>{badge.id}</TableCell>
                  <TableCell>{renderBadgeImage(badge.image_url)}</TableCell>
                  <TableCell className="font-medium">{badge.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{badge.description || "-"}</TableCell>
                  <TableCell>{renderCriteria(badge.criteria)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditBadge(badge)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteBadge(badge)} 
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

      {/* Create Badge Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Rozet Oluştur</DialogTitle>
            <DialogDescription>
              Kullanıcıların kazanabileceği yeni bir rozet oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateBadge}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="badge-name" className="text-right">Rozet Adı</Label>
                <div className="col-span-3">
                  <Input 
                    id="badge-name" 
                    value={newBadge.name} 
                    onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                    required
                    placeholder="Örn: Ders Uzmanı"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="badge-description" className="text-right">Açıklama</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="badge-description" 
                    value={newBadge.description} 
                    onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                    placeholder="Rozet açıklaması"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="badge-image" className="text-right">Görsel URL</Label>
                <div className="col-span-3">
                  <Input 
                    id="badge-image" 
                    value={newBadge.image_url} 
                    onChange={(e) => setNewBadge({ ...newBadge, image_url: e.target.value })}
                    placeholder="https://örnek.com/rozet.png"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="badge-criteria" className="text-right pt-2">Kazanma Kriteri</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="badge-criteria" 
                    value={newBadge.criteria} 
                    onChange={(e) => setNewBadge({ ...newBadge, criteria: e.target.value })}
                    placeholder="JSON formatında kriter"
                    rows={6}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON formatında kazanma kriteri. Örnek: {`{"type": "lessons_completed", "count": 5}`}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium">Kriter Tipleri:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>lessons_completed: Belirli sayıda ders tamamlama</li>
                      <li>points: Belirli sayıda puan kazanma</li>
                      <li>streak: Belirli gün sayısı kadar çalışma serisi</li>
                      <li>perfect_score: Belirli sayıda mükemmel skor</li>
                      <li>specific_module: Belirli bir modülü tamamlama</li>
                    </ul>
                  </div>
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
                disabled={createBadgeMutation.isPending}
              >
                {createBadgeMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Badge Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rozet Düzenle</DialogTitle>
            <DialogDescription>
              Rozet bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateBadge}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Rozet Adı</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit-name" 
                    value={selectedBadge?.name || ""} 
                    onChange={(e) => setSelectedBadge({ ...selectedBadge, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Açıklama</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="edit-description" 
                    value={selectedBadge?.description || ""} 
                    onChange={(e) => setSelectedBadge({ ...selectedBadge, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-image" className="text-right">Görsel URL</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit-image" 
                    value={selectedBadge?.image_url || ""} 
                    onChange={(e) => setSelectedBadge({ ...selectedBadge, image_url: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-criteria" className="text-right pt-2">Kazanma Kriteri</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="edit-criteria" 
                    value={typeof selectedBadge?.criteria === 'string' 
                      ? selectedBadge?.criteria 
                      : JSON.stringify(selectedBadge?.criteria, null, 2) || ""}
                    onChange={(e) => setSelectedBadge({ ...selectedBadge, criteria: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
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
                disabled={updateBadgeMutation.isPending}
              >
                {updateBadgeMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rozet Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Rozeti silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              {selectedBadge?.image_url && (
                <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-md">
                  <img 
                    src={selectedBadge?.image_url} 
                    alt={selectedBadge?.name}
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-badge.svg';
                    }}
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">{selectedBadge?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedBadge?.description}</p>
              </div>
            </div>
            
            <p className="text-center text-destructive">
              Bu rozeti sildiğinizde, bunu kazanmış kullanıcılar da bu rozetten mahrum kalacaklar.
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
              onClick={confirmDeleteBadge}
              disabled={deleteBadgeMutation.isPending}
            >
              {deleteBadgeMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}