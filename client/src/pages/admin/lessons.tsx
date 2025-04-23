import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  RefreshCcw, 
  Edit, 
  Trash2,
  FileEdit,
  ArrowLeft
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function LessonsManagement() {
  const [searchParams] = useLocation();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newLesson, setNewLesson] = useState({
    id: "",
    module_id: "",
    title: "",
    description: "",
    duration: 15,
    order: 1,
    status: "locked"
  });
  const { toast } = useToast();

  // Parse module ID from URL if available
  useEffect(() => {
    // Extract moduleId from hash or search params
    const urlParams = new URLSearchParams(window.location.search);
    const moduleIdFromUrl = urlParams.get('moduleId');
    
    if (moduleIdFromUrl) {
      setSelectedModuleId(moduleIdFromUrl);
      setNewLesson(prev => ({ ...prev, module_id: moduleIdFromUrl }));
    }
  }, [searchParams]);

  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/admin/modules"],
    queryFn: async () => {
      const response = await fetch("/api/admin/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");
      return await response.json();
    }
  });

  const { data: lessons = [], isLoading: lessonsLoading, refetch } = useQuery({
    queryKey: ["/api/admin/lessons", selectedModuleId],
    queryFn: async () => {
      const url = selectedModuleId 
        ? `/api/admin/modules/${selectedModuleId}/lessons` 
        : "/api/admin/lessons";
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch lessons");
      return await response.json();
    },
    enabled: !!selectedModuleId
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create lesson");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", selectedModuleId] });
      setShowCreateModal(false);
      setNewLesson({
        id: "",
        module_id: selectedModuleId || "",
        title: "",
        description: "",
        duration: 15,
        order: 1,
        status: "locked"
      });
      toast({ title: "Ders oluşturuldu", description: "Yeni ders başarıyla oluşturuldu." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ders oluşturulamadı", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await fetch(`/api/admin/lessons/${lessonData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update lesson");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", selectedModuleId] });
      setIsEditModalOpen(false);
      toast({ title: "Ders güncellendi", description: "Ders bilgileri başarıyla güncellendi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Güncelleme başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete lesson");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons", selectedModuleId] });
      setIsDeleteModalOpen(false);
      toast({ title: "Ders silindi", description: "Ders başarıyla silindi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Silme işlemi başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const filteredLessons = lessons.filter((lesson: any) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const lessonData = `${lesson.title} ${lesson.description || ""}`.toLowerCase();
    
    return searchTerms.every(term => lessonData.includes(term));
  });

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setNewLesson(prev => ({ ...prev, module_id: moduleId }));
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    createLessonMutation.mutate(newLesson);
  };

  const handleEditLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setIsEditModalOpen(true);
  };

  const handleDeleteLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLesson) return;
    
    updateLessonMutation.mutate({
      id: selectedLesson.id,
      module_id: selectedLesson.module_id,
      title: selectedLesson.title,
      description: selectedLesson.description,
      duration: selectedLesson.duration,
      order: selectedLesson.order,
      status: selectedLesson.status
    });
  };

  const confirmDeleteLesson = () => {
    if (!selectedLesson) return;
    deleteLessonMutation.mutate(selectedLesson.id);
  };

  const editLessonContent = (lessonId: string) => {
    // Navigate to lesson content editor
    navigate(`/admin/lessons/${lessonId}/content`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "locked":
        return <Badge variant="outline">Kilitli</Badge>;
      case "available":
        return <Badge variant="default">Erişilebilir</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-success">Tamamlanmış</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedModuleName = modules.find((m: any) => m.id === selectedModuleId)?.title || "Tüm Modüller";

  // Show module selection if no module is selected
  if (!selectedModuleId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ders Yönetimi</h1>
          <p className="text-muted-foreground">
            Önce bir modül seçin
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulesLoading ? (
            <div>Modüller yükleniyor...</div>
          ) : (
            modules.map((module: any) => (
              <Card key={module.id} className="cursor-pointer hover:bg-secondary/10" onClick={() => handleModuleChange(module.id)}>
                <CardHeader>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>
                    Sıra: {module.order}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2">{module.description || "Açıklama yok"}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Bu Modüldeki Dersleri Görüntüle
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedModuleId(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Modüllere Dön
            </Button>
          </div>
          <h1 className="text-2xl font-bold mt-2">Ders Yönetimi: {selectedModuleName}</h1>
          <p className="text-muted-foreground">
            Modüle ait dersleri oluşturun, düzenleyin ve yönetin.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ders
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Ders ara..."
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
              <TableHead>Süre</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İçerik</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessonsLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Dersler yükleniyor...
                </TableCell>
              </TableRow>
            ) : filteredLessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Ders bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredLessons.map((lesson: any) => (
                <TableRow key={lesson.id}>
                  <TableCell>{lesson.order}</TableCell>
                  <TableCell className="font-mono text-xs">{lesson.id}</TableCell>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell>{lesson.duration} dakika</TableCell>
                  <TableCell>{getStatusBadge(lesson.status)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => editLessonContent(lesson.id)}
                    >
                      <FileEdit className="h-4 w-4 mr-2" />
                      İçeriği Düzenle
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
                        <DropdownMenuItem onClick={() => handleEditLesson(lesson)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteLesson(lesson)} 
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

      {/* Create Lesson Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Ders Oluştur</DialogTitle>
            <DialogDescription>
              Bu modül için yeni bir ders oluşturun. Ders içeriğini daha sonra düzenleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateLesson}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson-id" className="text-right">Ders ID</Label>
                <div className="col-span-3">
                  <Input 
                    id="lesson-id" 
                    value={newLesson.id} 
                    onChange={(e) => setNewLesson({ ...newLesson, id: e.target.value })}
                    required
                    placeholder="Örn: lesson1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Benzersiz bir ID belirleyin, boşluk kullanmayın.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson-title" className="text-right">Başlık</Label>
                <div className="col-span-3">
                  <Input 
                    id="lesson-title" 
                    value={newLesson.title} 
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    required
                    placeholder="Ders başlığı"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson-description" className="text-right">Açıklama</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="lesson-description" 
                    value={newLesson.description} 
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    placeholder="Ders açıklaması"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson-duration" className="text-right">Süre (dk)</Label>
                <div className="col-span-3">
                  <Input 
                    id="lesson-duration" 
                    type="number" 
                    min="1" 
                    value={newLesson.duration.toString()} 
                    onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 15 })}
                    required
                    placeholder="Tahmini ders süresi (dakika)"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson-order" className="text-right">Sıra</Label>
                <div className="col-span-3">
                  <Input 
                    id="lesson-order" 
                    type="number" 
                    min="1" 
                    value={newLesson.order.toString()} 
                    onChange={(e) => setNewLesson({ ...newLesson, order: parseInt(e.target.value) || 1 })}
                    required
                    placeholder="Görüntülenme sırası"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson-status" className="text-right">Durum</Label>
                <div className="col-span-3">
                  <Select 
                    value={newLesson.status} 
                    onValueChange={(value) => setNewLesson({ ...newLesson, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ders durumunu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="locked">Kilitli</SelectItem>
                      <SelectItem value="available">Erişilebilir</SelectItem>
                      <SelectItem value="completed">Tamamlanmış</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={createLessonMutation.isPending}
              >
                {createLessonMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ders Düzenle</DialogTitle>
            <DialogDescription>
              Ders bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateLesson}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ders ID</Label>
                <div className="col-span-3">
                  <Input 
                    value={selectedLesson?.id || ""} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">Başlık</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit-title" 
                    value={selectedLesson?.title || ""} 
                    onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">Açıklama</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="edit-description" 
                    value={selectedLesson?.description || ""} 
                    onChange={(e) => setSelectedLesson({ ...selectedLesson, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-duration" className="text-right">Süre (dk)</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit-duration" 
                    type="number" 
                    min="1" 
                    value={selectedLesson?.duration?.toString() || "15"} 
                    onChange={(e) => setSelectedLesson({ ...selectedLesson, duration: parseInt(e.target.value) || 15 })}
                    required
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
                    value={selectedLesson?.order?.toString() || "1"} 
                    onChange={(e) => setSelectedLesson({ ...selectedLesson, order: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Durum</Label>
                <div className="col-span-3">
                  <Select 
                    value={selectedLesson?.status || "locked"} 
                    onValueChange={(value) => setSelectedLesson({ ...selectedLesson, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ders durumunu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="locked">Kilitli</SelectItem>
                      <SelectItem value="available">Erişilebilir</SelectItem>
                      <SelectItem value="completed">Tamamlanmış</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={updateLessonMutation.isPending}
              >
                {updateLessonMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ders Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Dersi silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">
              <strong>ID:</strong> {selectedLesson?.id}
            </p>
            <p className="mb-2">
              <strong>Başlık:</strong> {selectedLesson?.title}
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
              onClick={confirmDeleteLesson}
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}