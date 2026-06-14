'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plug,
  Bot,
  FlaskConical,
  MessageSquare,
  Brain,
  BookOpen,
  GitBranch,
  Radio,
  MessagesSquare,
  BarChart3,
  Activity,
  Menu,
  X,
  Zap,
  Wrench,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigationItems = [
  {
    category: 'Core',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Providers', href: '/admin/providers', icon: Plug },
      { label: 'Models', href: '/admin/models', icon: Bot },
      { label: 'API Test', href: '/admin/api-test', icon: FlaskConical },
    ],
  },
  {
    category: 'Development',
    items: [
      { label: 'Chat', href: '/admin/chat', icon: MessageSquare },
      { label: 'Agent', href: '/admin/agent', icon: Brain },
      { label: 'Docs', href: '/admin/docs', icon: BookOpen },
    ],
  },
  {
    category: 'Data',
    items: [
      { label: 'Routing', href: '/admin/routing', icon: GitBranch },
      { label: 'Sessions', href: '/admin/sessions', icon: Radio },
      { label: 'Conversations', href: '/admin/conversations', icon: MessagesSquare },
      { label: 'Usage', href: '/admin/usage', icon: BarChart3 },
    ],
  },
  {
    category: 'System',
    items: [
      { label: 'Tools', href: '/admin/tools', icon: Wrench },
      { label: 'Monitor', href: '/admin/monitor', icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-64 overflow-hidden border-r border-border bg-background transition-transform duration-200 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Proxi
          </h1>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>

        {/* Navigation - no scroll */}
        <nav className="flex flex-1 flex-col gap-4 p-4">
          {navigationItems.map(section => (
            <div key={section.category}>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">ZombieCoder v2.0</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
