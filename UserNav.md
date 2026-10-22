// src/components/UserNav.tsx
"use client";

import {
BellRing,
ChevronDown,
LayoutDashboard,
LogIn,
LogOut,
Megaphone,
NotebookPen,
NotepadText,
User,
UserPlus,
UserRound,
Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function UserNav() {
const { data: session, isPending } = authClient.useSession();
const [isOpen, setIsOpen] = useState(false);
const router = useRouter();

const handleSignOut = async () => {
await authClient.signOut({
fetchOptions: {
onSuccess: () => {
router.push("/login");
},
},
});
};

const toggleMenu = () => setIsOpen(!isOpen);

if (isPending)
return (
<div className="h-7 w-7 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-900 transition-colors duration-300" />
);

return (
<div
className="relative z-50"
onMouseEnter={() => setIsOpen(true)}
onMouseLeave={() => setIsOpen(false)} >
<div
onClick={toggleMenu}
className={`flex cursor-pointer items-center gap-2 rounded-full border bg-gray-100 shadow-sm dark:bg-neutral-900 p-1 pr-3 transition-all duration-300 ${
          isOpen
            ? "border-gray-300 dark:border-neutral-700 ring-1 ring-gray-300 dark:ring-neutral-700"
            : "border-transparent hover:border-gray-300 dark:hover:border-neutral-700"
        }`} >
{session ? (
<div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800 text-[10px] font-bold text-gray-900 dark:text-white transition-colors duration-300">
{session.user.image ? (
<Image
src={session.user.image}
alt={session.user.name || "Avatar"}
fill
className="object-cover"
sizes="28px"
/>
) : (
session.user.name?.charAt(0).toUpperCase()
)}
</div>
) : (
<div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 ring-0.5 ring-gray-300 dark:ring-neutral-700 transition-colors duration-300">
<UserRound size={12} />
</div>
)}

        <ChevronDown
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isOpen
              ? "rotate-180 text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-neutral-500"
          }`}
        />
      </div>

      {/* --- DROPDOWN MENU --- */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 dark:bg-neutral-950 absolute top-full right-0 w-60 pt-2 duration-200">
          <div className="absolute -top-2 right-0 left-0 h-2" />

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-950 p-1.5 shadow-2xl shadow-black/10 dark:shadow-black/50 backdrop-blur-xl transition-colors duration-300">
            <div className="mb-1 border-b border-gray-200 dark:border-neutral-800/50 px-3 py-2.5 transition-colors duration-300">
              {session ? (
                <>
                  <p className="truncate text-xs font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    {session.user.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-neutral-500 transition-colors duration-300">
                    {session.user.email}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    Visitante
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-500 dark:text-neutral-500 leading-tight transition-colors duration-300">
                    Faça login para acessar os simulados.
                  </p>
                </>
              )}
            </div>

            {session && (
              <>
                <div className="space-y-1 mt-1">
                  <MenuLink
                    href="/aluno/minha-conta"
                    icon={<User size={14} />}
                    label="Minha Conta"
                    onClick={() => setIsOpen(false)}
                  />
                </div>
                <div className="border-b w-full border-gray-200 dark:border-neutral-800 pt-1 transition-colors duration-300"></div>
              </>
            )}

            <div className="space-y-1 mt-1">
              <MenuLink
                href="/aluno"
                icon={<LayoutDashboard size={14} />}
                label="Painel do Aluno"
                onClick={() => setIsOpen(false)}
              />

              {session && (
                <>
                  <MenuLink
                    href="/aluno/concursos"
                    icon={<BellRing size={14} />}
                    label="Concursos Abertos"
                    onClick={() => setIsOpen(false)}
                  />
                  <MenuLink
                    href="/aluno/editais"
                    icon={<NotepadText size={14} />}
                    label="Editais"
                    onClick={() => setIsOpen(false)}
                  />
                  <MenuLink
                    href="/aluno/aulas"
                    icon={<Video size={14} />}
                    label="Aulas"
                    onClick={() => setIsOpen(false)}
                  />
                  <MenuLink
                    href="/aluno/simulados"
                    icon={<NotebookPen size={14} />}
                    label="Meus Simulados"
                    onClick={() => setIsOpen(false)}
                  />
                  <MenuLink
                    href="/aluno/noticias"
                    icon={<Megaphone size={14} />}
                    label="Notícias"
                    onClick={() => setIsOpen(false)}
                  />
                </>
              )}
            </div>

            {/* Ações (Sair / Entrar) */}
            <div className="mt-1.5 border-t border-gray-200 dark:border-neutral-800/50 pt-1 transition-colors duration-300">
              {session ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 cursor-pointer text-left text-xs bg-gray-600/10 font-medium text-gray-800 dark:text-red-500 dark:bg-red-900/10 transition-colors hover:bg-gray-900/20 dark:hover:bg-red-500/10 hover:text-gray-900 dark:hover:text-red-400"
                >
                  <LogOut size={14} />
                  Sair da conta
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-1 py-1">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-neutral-800 py-2 text-[11px] font-bold text-gray-900 dark:text-white duration-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <LogIn size={12} />
                    Entrar
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#009966] dark:bg-emerald-600 py-2 text-[11px] font-bold text-white duration-300 hover:bg-[#008055] dark:hover:bg-emerald-500 transition-colors"
                  >
                    <UserPlus size={12} />
                    Criar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

);
}

// Componente auxiliar para os links
function MenuLink({
href,
icon,
label,
onClick,
}: {
href: string;
icon: React.ReactNode;
label: string;
onClick?: () => void;
}) {
return (
<Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 dark:text-neutral-400 transition-all duration-300 hover:bg-gray-200 dark:hover:bg-neutral-800/80 hover:text-gray-900 dark:hover:text-white"
    >
<span className="text-gray-400 dark:text-neutral-500 transition-colors duration-300 group-hover:text-[#009966] dark:group-hover:text-emerald-500">
{icon}
</span>
{label}
</Link>
);
}
