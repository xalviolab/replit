import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-medium">CardioEdu</span>
            <span className="text-neutral-800/50 text-sm">© {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex space-x-6">
            <Link className="text-neutral-800/70 hover:text-neutral-800 text-sm" href="/about">
              Hakkımızda
            </Link>
            <Link className="text-neutral-800/70 hover:text-neutral-800 text-sm" href="/contact">
              İletişim
            </Link>
            <Link className="text-neutral-800/70 hover:text-neutral-800 text-sm" href="/help">
              Yardım
            </Link>
            <Link className="text-neutral-800/70 hover:text-neutral-800 text-sm" href="/privacy">
              Gizlilik
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
