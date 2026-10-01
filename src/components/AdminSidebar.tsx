"use client";

import {
  Bell,
  Blocks,
  Hammer,
  Home,
  LayoutDashboard,
  Package,
  Star,
  TicketPercent,
  Truck,
  UserRoundCog,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Definimos o tipo do usuário que vem da sessão
interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-neutral-800 bg-neutral-900 text-white">
      {/* --- HEADER (Logo) --- */}
      <SidebarHeader className="flex h-20 justify-center border-b border-neutral-800 bg-neutral-900 px-6">
        <div className="flex items-center justify-center gap-2 py-6">
          <Image
            src="/icons/logo.png"
            alt="Logo G.A.T"
            width={55}
            height={35}
            className="object-cover"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            G.A.T
          </span>
        </div>
      </SidebarHeader>

      {/* --- CONTEÚDO (Menu) --- */}
      <SidebarContent className="bg-neutral-900 px-4 py-7 text-neutral-300">
        <SidebarMenu>
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin"}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Pedidos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/pedidos"}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/pedidos">
                <Truck className="mr-2 h-5 w-5" />
                <span>Pedidos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Produtos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/produtos")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/produtos">
                <Package className="mr-2 h-5 w-5" />
                <span>Produtos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Categorias */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/categorias")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/categorias">
                <Blocks className="mr-2 h-5 w-5" />
                <span>Categorias</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Serviços */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/servicos")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/servicos">
                <Hammer className="mr-2 h-5 w-5" />
                <span>Serviços</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Prestadores */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/prestadores")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/prestadores">
                <UserRoundCog className="mr-2 h-5 w-5" />
                <span>Prestadores</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Solicitações de Serviços */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/solicitacoes")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/solicitacoes">
                <Bell className="mr-2 h-5 w-5" />
                <span>Solicitações de Serviços</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Afiliados */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/afiliados")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/afiliados">
                <Users className="mr-2 h-5 w-5" />
                <span>Afiliados</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Avaliações */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin/avaliacoes"}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/avaliacoes">
                <Star className="mr-2 h-5 w-5" />
                <span>Avaliações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Cupons */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin/cupons")}
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white data-[active=true]:border data-[active=true]:border-orange-500/30 data-[active=true]:bg-orange-500/15 data-[active=true]:font-semibold data-[active=true]:text-orange-400 data-[active=true]:shadow-sm"
            >
              <Link href="/admin/cupons">
                <TicketPercent className="mr-2 h-5 w-5" />
                <span>Cupons</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Separador */}
          <div className="my-4 h-[1px] bg-neutral-800" />

          {/* Voltar ao Site */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                <span>Voltar ao Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* --- FOOTER (Usuário) --- */}
      <SidebarFooter className="border-t border-neutral-800 bg-neutral-900 p-4">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-700/50 bg-neutral-800/80 p-3 transition-colors hover:bg-neutral-800">
          <Avatar className="h-9 w-9 border border-neutral-700">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-orange-600 font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden text-left">
            <span className="truncate text-sm font-semibold text-white">
              {user.name}
            </span>
            <span className="truncate text-xs text-neutral-400">Admin</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
