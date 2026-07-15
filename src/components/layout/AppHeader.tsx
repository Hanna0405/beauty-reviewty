"use client";

import Link from "next/link";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarWithBadge } from "@/components/notifications/AvatarWithBadge";
import Portal from "@/components/ui/Portal";

const MENU_WIDTH = 176; // w-44
const MENU_GAP = 8;

export default function AppHeader() {
  const { user, profile, loading, logout } = useAuth();
  const nameOrEmail = profile?.displayName || user?.email || "";
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
      {/* LEFT: Logo + nav */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Link
          href="/"
          className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500 font-bold text-white transition-colors hover:bg-pink-600"
        >
          BR
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-xs text-gray-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            BeautyReviewty
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-3 overflow-hidden sm:gap-6">
          <Link
            href="/masters"
            className="truncate text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Masters
          </Link>
          <Link
            href="/reviewty"
            className="truncate text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Reviewty
          </Link>
        </div>
      </div>

      {/* RIGHT: Auth area (never blocks) */}
      <div className="flex shrink-0 items-center gap-2">
        {!user && (
          <>
            <Link
              href="/auth/login"
              aria-disabled={loading ? "true" : "false"}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              aria-disabled={loading ? "true" : "false"}
              className="inline-flex items-center rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-pink-700"
            >
              Sign up
            </Link>
          </>
        )}

        {user && (
          <AccountMenu
            nameOrEmail={nameOrEmail}
            onLogout={logout}
            user={user}
            profile={profile}
          />
        )}
      </div>
    </div>
  );
}

function AccountMenu({
  nameOrEmail,
  onLogout,
  user,
  profile,
}: {
  nameOrEmail?: string | null;
  onLogout: () => Promise<void>;
  user: any;
  profile: any;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const safeRightRaw = getComputedStyle(document.documentElement)
      .getPropertyValue("--safe-area-inset-right")
      .trim();
    const safeRight = Math.max(8, Number.parseFloat(safeRightRaw) || 0);
    let left = rect.right - MENU_WIDTH;
    left = Math.min(left, viewportW - MENU_WIDTH - safeRight);
    left = Math.max(8, left);
    const top = rect.bottom + MENU_GAP;
    const next = { top, left };
    setMenuPos(next);
    return next;
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((wasOpen) => {
      if (wasOpen) {
        setMenuPos(null);
        return false;
      }
      updateMenuPosition();
      return true;
    });
  };
  const close = () => {
    setOpen(false);
    setMenuPos(null);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="focus:outline-none"
      >
        <AvatarWithBadge
          user={{
            uid: user.uid,
            role: profile?.role || "client",
            name: nameOrEmail || undefined,
          }}
        />
      </button>
      {open ? (
        <Portal>
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[100] w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            style={
              menuPos
                ? { top: menuPos.top, left: menuPos.left }
                : { top: 0, left: 0, visibility: "hidden" as const }
            }
          >
            <div className="truncate px-3 py-2 text-sm font-medium text-gray-900">
              {nameOrEmail}
            </div>
            <div className="h-px bg-gray-100" />
            <Link
              href="/dashboard/master"
              role="menuitem"
              onClick={close}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                void onLogout();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </Portal>
      ) : null}
    </div>
  );
}
