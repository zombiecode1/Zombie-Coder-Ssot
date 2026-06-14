'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/context/admin';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Database,
  Server,
  Plug,
  Zap,
  Wrench,
  GitBranch,
  MessageSquare,
  TestTube,
  BookOpen,
  Brain,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';

const commands = [
  {
    category: 'Navigation',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Models', icon: Database, href: '/admin/models' },
      { label: 'Servers', icon: Server, href: '/admin/servers' },
      { label: 'Providers', icon: Plug, href: '/admin/providers' },
      { label: 'Agents', icon: Zap, href: '/admin/agents' },
      { label: 'Tools', icon: Wrench, href: '/admin/tools' },
      { label: 'MCP', icon: GitBranch, href: '/admin/mcp' },
      { label: 'Chat', icon: MessageSquare, href: '/admin/chat' },
      { label: 'API Test', icon: TestTube, href: '/admin/api-test' },
      { label: 'Logs', icon: BookOpen, href: '/admin/logs' },
      { label: 'Memory Viewer', icon: Brain, href: '/admin/memory-viewer' },
      { label: 'Prompt Versions', icon: FileText, href: '/admin/prompt-versions' },
      { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { label: 'Toggle Logs', icon: BookOpen, action: 'toggle-logs' },
      { label: 'Logout', icon: LogOut, action: 'logout' },
    ],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLogsVisible, isLogsVisible } = useAdmin();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (item: any) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action === 'toggle-logs') {
      setIsLogsVisible(!isLogsVisible);
    } else if (item.action === 'logout') {
      router.push('/');
    }
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search navigation, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map(group => (
          <CommandGroup key={group.category} heading={group.category}>
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.label} onSelect={() => handleSelect(item)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
