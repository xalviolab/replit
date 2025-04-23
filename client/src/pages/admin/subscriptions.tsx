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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  RefreshCcw, 
  Edit, 
  Trash2,
  CreditCard,
  CheckCircle,
  XCircle,
  ShieldCheck
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function SubscriptionsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: 0,
    interval: "month",
    currency: "USD",
    features: "",
    is_active: true,
    metadata: JSON.stringify({
      badge_id: null,
      priority: 1
    }, null, 2)
  });
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isViewSubscriptionModalOpen, setIsViewSubscriptionModalOpen] = useState(false);
  const { toast } = useToast();

  // Get all subscription plans
  const { data: plans = [], isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ["/api/admin/plans"],
    queryFn: async () => {
      const response = await fetch("/api/admin/plans");
      if (!response.ok) throw new Error("Failed to fetch subscription plans");
      return await response.json();
    }
  });

  // Get all active subscriptions
  const { data: subscriptions = [], isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return await response.json();
    }
  });

  // Create subscription plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      try {
        // Process features from string to array if needed
        const features = planData.features
          .split('\n')
          .filter((line: string) => line.trim() !== '')
          .map((line: string) => line.trim());

        // Parse metadata
        const metadata = typeof planData.metadata === 'string'
          ? JSON.parse(planData.metadata)
          : planData.metadata;

        const dataToSend = {
          ...planData,
          features,
          metadata,
          price: Number(planData.price) * 100, // Convert to cents for Stripe
        };

        const response = await fetch("/api/admin/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create subscription plan");
        }
        
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to create subscription plan");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setShowCreatePlanModal(false);
      setNewPlan({
        name: "",
        description: "",
        price: 0,
        interval: "month",
        currency: "USD",
        features: "",
        is_active: true,
        metadata: JSON.stringify({
          badge_id: null,
          priority: 1
        }, null, 2)
      });
      toast({ title: "Plan oluşturuldu", description: "Yeni abonelik planı başarıyla oluşturuldu." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Plan oluşturulamadı", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Update subscription plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      try {
        // Process features if it's a string
        const features = typeof planData.features === 'string'
          ? planData.features
              .split('\n')
              .filter((line: string) => line.trim() !== '')
              .map((line: string) => line.trim())
          : planData.features;

        // Parse metadata if it's a string
        const metadata = typeof planData.metadata === 'string'
          ? JSON.parse(planData.metadata)
          : planData.metadata;

        const dataToSend = {
          ...planData,
          features,
          metadata,
          price: Number(planData.price) * 100, // Convert to cents for Stripe
        };

        const response = await fetch(`/api/admin/plans/${planData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update subscription plan");
        }
        
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to update subscription plan");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsEditPlanModalOpen(false);
      toast({ title: "Plan güncellendi", description: "Abonelik planı başarıyla güncellendi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Güncelleme başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel subscription");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setIsViewSubscriptionModalOpen(false);
      toast({ title: "Abonelik iptal edildi", description: "Abonelik başarıyla iptal edildi." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "İptal işlemi başarısız", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Filter plans based on search query
  const filteredPlans = plans.filter((plan: any) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const planData = `${plan.name} ${plan.description || ""}`.toLowerCase();
    
    return searchTerms.every(term => planData.includes(term));
  });

  // Filter subscriptions based on search query
  const filteredSubscriptions = subscriptions.filter((sub: any) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const subData = `${sub.user?.username || ""} ${sub.user?.email || ""} ${sub.plan?.name || ""}`.toLowerCase();
    
    return searchTerms.every(term => subData.includes(term));
  });

  // Handle creating a new subscription plan
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate metadata JSON if it's a string
      if (typeof newPlan.metadata === 'string') {
        JSON.parse(newPlan.metadata);
      }
      
      createPlanMutation.mutate(newPlan);
    } catch (error) {
      toast({ 
        title: "Geçersiz metadata formatı", 
        description: "Metadata alanı geçerli bir JSON formatında olmalıdır.", 
        variant: "destructive" 
      });
    }
  };

  // Handle editing a subscription plan
  const handleEditPlan = (plan: any) => {
    const preparedPlan = {
      ...plan,
      price: plan.price / 100, // Convert from cents to dollars for display
      features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features,
      metadata: typeof plan.metadata === 'object' 
        ? JSON.stringify(plan.metadata, null, 2) 
        : plan.metadata
    };
    
    setSelectedPlan(preparedPlan);
    setIsEditPlanModalOpen(true);
  };

  // Handle update plan submission
  const handleUpdatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;
    
    try {
      // Validate metadata JSON if it's a string
      if (typeof selectedPlan.metadata === 'string') {
        JSON.parse(selectedPlan.metadata);
      }
      
      updatePlanMutation.mutate(selectedPlan);
    } catch (error) {
      toast({ 
        title: "Geçersiz metadata formatı", 
        description: "Metadata alanı geçerli bir JSON formatında olmalıdır.", 
        variant: "destructive" 
      });
    }
  };

  // Handle viewing a subscription details
  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsViewSubscriptionModalOpen(true);
  };

  // Handle canceling a subscription
  const handleCancelSubscription = () => {
    if (!selectedSubscription) return;
    cancelSubscriptionMutation.mutate(selectedSubscription.id);
  };

  // Format price for display
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(price / 100); // Convert cents to dollars
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge for subscription
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success">Aktif</Badge>;
      case 'canceled':
        return <Badge variant="destructive">İptal Edildi</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Ödeme Bekliyor</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Ödenmemiş</Badge>;
      case 'trial':
        return <Badge variant="default">Deneme</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle showing plans or subscriptions tab
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Abonelik Yönetimi</h1>
          <p className="text-muted-foreground">
            Premium abonelik planlarını ve kullanıcı aboneliklerini yönetin.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={activeTab === 'plans' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('plans')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Planlar
          </Button>
          <Button 
            variant={activeTab === 'subscriptions' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('subscriptions')}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Abonelikler
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={activeTab === 'plans' ? "Plan ara..." : "Abonelik ara..."}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {activeTab === 'plans' && (
          <Button onClick={() => setShowCreatePlanModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Plan
          </Button>
        )}
        <Button 
          size="icon" 
          variant="outline" 
          onClick={() => activeTab === 'plans' ? refetchPlans() : refetchSubscriptions()}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Adı</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Aralık</TableHead>
                <TableHead>Özellikler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plansLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Planlar yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Plan bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(plan.price, plan.currency)}</TableCell>
                    <TableCell>{plan.interval === 'month' ? 'Aylık' : 'Yıllık'}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside text-sm">
                        {Array.isArray(plan.features) ? (
                          plan.features.map((feature: string, idx: number) => (
                            <li key={idx}>{feature}</li>
                          ))
                        ) : (
                          <li>Özellik bulunamadı</li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell>
                      {plan.is_active ? (
                        <Badge className="bg-success">Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Pasif</Badge>
                      )}
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
                          <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedPlan(plan);
                              setIsDeletePlanModalOpen(true);
                            }} 
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
      )}
      
      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Abonelikler yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Abonelik bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((subscription: any) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.user?.username}</div>
                        <div className="text-sm text-muted-foreground">{subscription.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{subscription.plan?.name || 'Bilinmeyen Plan'}</TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>{formatDate(subscription.current_period_start)}</TableCell>
                    <TableCell>{formatDate(subscription.current_period_end)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewSubscription(subscription)}
                      >
                        Detaylar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={showCreatePlanModal} onOpenChange={setShowCreatePlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Abonelik Planı Oluştur</DialogTitle>
            <DialogDescription>
              Kullanıcıların satın alabileceği yeni bir abonelik planı oluşturun.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreatePlan}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan Adı</Label>
                  <Input 
                    id="plan-name" 
                    value={newPlan.name} 
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    required
                    placeholder="Örn: Premium Plan"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan-price">Fiyat</Label>
                  <div className="flex">
                    <Input 
                      id="plan-price" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPlan.price.toString()} 
                      onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
                      required
                      placeholder="9.99"
                    />
                    <select
                      className="ml-2 rounded-md border border-input px-3 py-2"
                      value={newPlan.currency}
                      onChange={(e) => setNewPlan({ ...newPlan, currency: e.target.value })}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-interval">Ödeme Aralığı</Label>
                  <select
                    id="plan-interval"
                    className="w-full rounded-md border border-input px-3 py-2"
                    value={newPlan.interval}
                    onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value })}
                  >
                    <option value="month">Aylık</option>
                    <option value="year">Yıllık</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan-status" className="flex items-center justify-between">
                    Durum
                    <Switch 
                      id="plan-status" 
                      checked={newPlan.is_active} 
                      onCheckedChange={(checked) => setNewPlan({ ...newPlan, is_active: checked })}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground pt-2">
                    {newPlan.is_active ? "Plan aktif ve satın alınabilir" : "Plan pasif ve satın alınamaz"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-description">Açıklama</Label>
                <Textarea 
                  id="plan-description" 
                  value={newPlan.description} 
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="Plan açıklaması"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-features">Özellikler (Her satıra bir özellik)</Label>
                <Textarea 
                  id="plan-features" 
                  value={newPlan.features} 
                  onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                  placeholder="Sınırsız içerik erişimi
Reklamları kaldırma
Özel rozetler"
                  rows={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-metadata">Metadata (JSON)</Label>
                <Textarea 
                  id="plan-metadata" 
                  value={newPlan.metadata} 
                  onChange={(e) => setNewPlan({ ...newPlan, metadata: e.target.value })}
                  className="font-mono text-sm"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  badge_id: Kazanılacak rozet ID'si, priority: Planın gösterim önceliği
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreatePlanModal(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={createPlanMutation.isPending}
              >
                {createPlanMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={isEditPlanModalOpen} onOpenChange={setIsEditPlanModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Abonelik Planını Düzenle</DialogTitle>
            <DialogDescription>
              Abonelik planı bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdatePlan}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Plan Adı</Label>
                  <Input 
                    id="edit-name" 
                    value={selectedPlan?.name || ""} 
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Fiyat</Label>
                  <div className="flex">
                    <Input 
                      id="edit-price" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedPlan?.price?.toString() || "0"} 
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <select
                      className="ml-2 rounded-md border border-input px-3 py-2"
                      value={selectedPlan?.currency || "USD"}
                      onChange={(e) => setSelectedPlan({ ...selectedPlan, currency: e.target.value })}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-interval">Ödeme Aralığı</Label>
                  <select
                    id="edit-interval"
                    className="w-full rounded-md border border-input px-3 py-2"
                    value={selectedPlan?.interval || "month"}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, interval: e.target.value })}
                  >
                    <option value="month">Aylık</option>
                    <option value="year">Yıllık</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="flex items-center justify-between">
                    Durum
                    <Switch 
                      id="edit-status" 
                      checked={selectedPlan?.is_active} 
                      onCheckedChange={(checked) => setSelectedPlan({ ...selectedPlan, is_active: checked })}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground pt-2">
                    {selectedPlan?.is_active ? "Plan aktif ve satın alınabilir" : "Plan pasif ve satın alınamaz"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Açıklama</Label>
                <Textarea 
                  id="edit-description" 
                  value={selectedPlan?.description || ""} 
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-features">Özellikler (Her satıra bir özellik)</Label>
                <Textarea 
                  id="edit-features" 
                  value={selectedPlan?.features || ""} 
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, features: e.target.value })}
                  rows={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-metadata">Metadata (JSON)</Label>
                <Textarea 
                  id="edit-metadata" 
                  value={typeof selectedPlan?.metadata === 'string' 
                    ? selectedPlan?.metadata 
                    : JSON.stringify(selectedPlan?.metadata, null, 2) || "{}"}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, metadata: e.target.value })}
                  className="font-mono text-sm"
                  rows={5}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditPlanModalOpen(false)}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={updatePlanMutation.isPending}
              >
                {updatePlanMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation Modal */}
      <Dialog open={isDeletePlanModalOpen} onOpenChange={setIsDeletePlanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonelik Planını Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Planı silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">
              <strong>Plan:</strong> {selectedPlan?.name}
            </p>
            <p className="mb-2">
              <strong>Fiyat:</strong> {selectedPlan?.price ? formatPrice(selectedPlan.price * 100, selectedPlan.currency) : ''}
            </p>
            <p className="text-destructive font-semibold text-center mt-4">
              Uyarı: Bu planın aktif aboneleri varsa, planı silmeden önce onları başka bir plana taşımanız gerekir.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeletePlanModalOpen(false)}
            >
              İptal
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={() => {
                // TODO: Implement delete plan mutation
                setIsDeletePlanModalOpen(false);
                toast({ 
                  title: "Bilgi", 
                  description: "Plan silme işlevi henüz uygulanmamıştır."
                });
              }}
            >
              Planı Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Subscription Modal */}
      <Dialog open={isViewSubscriptionModalOpen} onOpenChange={setIsViewSubscriptionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonelik Detayları</DialogTitle>
            <DialogDescription>
              Kullanıcı abonelik bilgileri
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Kullanıcı Bilgileri</h3>
              <div className="rounded-md border p-3">
                <p><strong>Kullanıcı Adı:</strong> {selectedSubscription?.user?.username}</p>
                <p><strong>E-posta:</strong> {selectedSubscription?.user?.email}</p>
                <p><strong>Ad Soyad:</strong> {selectedSubscription?.user?.full_name || '-'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Abonelik Bilgileri</h3>
              <div className="rounded-md border p-3">
                <p><strong>Plan:</strong> {selectedSubscription?.plan?.name}</p>
                <p><strong>Durum:</strong> {getStatusBadge(selectedSubscription?.status)}</p>
                <p><strong>Başlangıç:</strong> {selectedSubscription?.current_period_start && formatDate(selectedSubscription.current_period_start)}</p>
                <p><strong>Bitiş:</strong> {selectedSubscription?.current_period_end && formatDate(selectedSubscription.current_period_end)}</p>
                {selectedSubscription?.cancel_at_period_end && (
                  <p className="text-warning-foreground">
                    <strong>Bilgi:</strong> Abonelik dönem sonunda iptal edilecek
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Ödeme Bilgileri</h3>
              <div className="rounded-md border p-3">
                <p><strong>Son Ödeme:</strong> {selectedSubscription?.latest_invoice_date ? formatDate(selectedSubscription.latest_invoice_date) : '-'}</p>
                <p><strong>Ödeme Miktarı:</strong> {selectedSubscription?.plan?.price ? formatPrice(selectedSubscription.plan.price, selectedSubscription.plan.currency) : '-'}</p>
                <p><strong>Ödeme Yöntemi:</strong> {selectedSubscription?.payment_method || '-'}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsViewSubscriptionModalOpen(false)}
            >
              Kapat
            </Button>
            
            {selectedSubscription?.status === 'active' && (
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={cancelSubscriptionMutation.isPending}
              >
                {cancelSubscriptionMutation.isPending ? "İptal Ediliyor..." : "Aboneliği İptal Et"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}