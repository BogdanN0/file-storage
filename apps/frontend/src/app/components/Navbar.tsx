"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavButton } from "./NavButton";

type NavbarVariant = "auto" | "app" | "auth";

type AppLink = { href: string; label: string };

type NavbarProps = {
  children?: React.ReactNode;

  variant?: NavbarVariant;

  appLinks?: AppLink[];

  onLogout?: () => void;

  brandHref?: string;
  brandText?: string;
};

type SlotName = "center" | "right";
type SlotProps = { children?: React.ReactNode };
type SlotComponent = React.FC<SlotProps> & { __slot?: SlotName };

const createSlot = (name: SlotName): SlotComponent => {
  const Comp: SlotComponent = ({ children }) => <>{children}</>;
  Comp.__slot = name;
  return Comp;
};

const CenterSlot = createSlot("center");
const RightSlot = createSlot("right");

const isSlot = (node: React.ReactNode, name: SlotName) =>
  React.isValidElement(node) && (node.type as any)?.__slot === name;

const getSlotChildren = (children: React.ReactNode, name: SlotName) => {
  const nodes = React.Children.toArray(children);
  const slotEl = nodes.find((n) => isSlot(n, name)) as
    | React.ReactElement<SlotProps>
    | undefined;
  return slotEl?.props?.children ?? null;
};

const hasAnySlots = (children: React.ReactNode) => {
  const nodes = React.Children.toArray(children);
  return nodes.some((n) => isSlot(n, "center") || isSlot(n, "right"));
};

export function Navbar({
  children,
  variant = "auto",
  appLinks = [
    { href: "/library", label: "Library" },
    { href: "/permission", label: "Permission" },
    { href: "/account", label: "Account" },
  ],
  onLogout,
  brandHref = "/",
  brandText = "Logo",
}: NavbarProps) {
  const pathname = usePathname();

  const useSlots = hasAnySlots(children);
  const hasChildren = React.Children.count(children) > 0;

  if (useSlots) {
    const center = getSlotChildren(children, "center");
    const right = getSlotChildren(children, "right");

    return (
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#fff",
          borderBottom: "1px solid #eee",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            padding: "1rem 2rem",
            gap: "1rem",
          }}
        >
          <div style={{ justifySelf: "start" }}>
            <Link
              href={brandHref}
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                textDecoration: "none",
                color: "black",
              }}
            >
              {brandText}
            </Link>
          </div>

          <div
            style={{ justifySelf: "center", display: "flex", gap: "0.75rem" }}
          >
            {center}
          </div>

          <div
            style={{
              justifySelf: "end",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {right}
          </div>
        </div>
      </nav>
    );
  }

  if (hasChildren) {
    return (
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#fff",
          borderBottom: "1px solid #eee",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            padding: "1rem 2rem",
            gap: "1rem",
          }}
        >
          <div style={{ justifySelf: "start" }}>
            <Link
              href={brandHref}
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                textDecoration: "none",
                color: "black",
              }}
            >
              {brandText}
            </Link>
          </div>

          <div
            style={{ justifySelf: "center", display: "flex", gap: "0.75rem" }}
          />

          <div
            style={{
              justifySelf: "end",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {children}
          </div>
        </div>
      </nav>
    );
  }

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const resolvedVariant: NavbarVariant =
    variant === "auto" ? (isAuthRoute ? "auth" : "app") : variant;

  const center =
    resolvedVariant === "app" ? (
      <>
        {appLinks.map((l) => (
          <NavButton key={l.href} beActive href={l.href}>
            {l.label}
          </NavButton>
        ))}
      </>
    ) : null;

  const right =
    resolvedVariant === "auth" ? (
      pathname === "/login" ? (
        <NavButton href="/register">Register</NavButton>
      ) : (
        <NavButton href="/login">Login</NavButton>
      )
    ) : onLogout ? (
      <Navbar.Logout onLogout={onLogout} />
    ) : null;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#fff",
        borderBottom: "1px solid #eee",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "1rem 2rem",
          gap: "1rem",
        }}
      >
        <div style={{ justifySelf: "start" }}>
          <Link
            href={brandHref}
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              textDecoration: "none",
              color: "black",
            }}
          >
            {brandText}
          </Link>
        </div>

        <div style={{ justifySelf: "center", display: "flex", gap: "0.75rem" }}>
          {center}
        </div>

        <div
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {right}
        </div>
      </div>
    </nav>
  );
}

Navbar.Center = CenterSlot;
Navbar.Right = RightSlot;

Navbar.Logout = function Logout({ onLogout }: { onLogout?: () => void }) {
  return (
    <NavButton onClick={() => onLogout?.()} variant="primary">
      Logout
    </NavButton>
  );
};
