import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { UserStats } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Bell, Flame, Trophy, LogOut, User, Settings, Crown } from 'lucide-react';

export default function Header() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user) return;
        
        // Make an API request for user stats
        const response = await fetch('/api/user/stats');
        
        if (response.ok) {
          const userStats = await response.json();
          setStats(userStats);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };
    
    if (user) {
      fetchStats();
    }
  }, [user]);
  
  // If not logged in, don't show header content
  if (!user) {
    return (
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <h1 className="text-xl font-bold">CardioEdu</h1>
            </div>
          </Link>
        </div>
      </header>
    );
  }
  
  // Get initials for avatar
  const getInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-xl font-bold">C</span>
            </div>
            <h1 className="text-xl font-bold">CardioEdu</h1>
          </div>
        </Link>
        
        <div className="flex items-center space-x-4">
          {stats && (
            <>
              <motion.div 
                className="hidden md:flex items-center space-x-1 text-sm bg-neutral-100 rounded-full px-3 py-1"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Flame className="h-4 w-4 text-primary" />
                <span className="font-medium">{stats.streak_days}</span>
                <span className="text-neutral-800/70">gün</span>
              </motion.div>
              
              <motion.div 
                className="hidden md:flex items-center space-x-1 text-sm bg-neutral-100 rounded-full px-3 py-1"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Trophy className="h-4 w-4 text-warning" />
                <span className="font-medium">{stats.points}</span>
                <span className="text-neutral-800/70">puan</span>
              </motion.div>
            </>
          )}
          
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-neutral-800 text-white text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.full_name || user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              {user.role_id === 1 && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center w-full cursor-pointer">
                      <Crown className="mr-2 h-4 w-4 text-warning" />
                      <span>Yönetim Paneli</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ayarlar</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending} 
                className="flex items-center cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
