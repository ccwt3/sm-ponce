import { NavbarMenu } from "@/components/layout/NavbarMenu";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-brand-border px-6 py-4">
      <span className="text-[17px] font-medium text-brand-text-primary">
        Motorefacciones
      </span>

      <NavbarMenu />
    </nav>
  );
}
