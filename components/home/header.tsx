'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { CircleEllipsis, LogOut, Settings } from "lucide-react";

//? The main header will be for navigating and adding the logo of the app

export default function Header() {
  return (
    <header className="flex m-2 justify-between">
      <div className="flex gap-2 m-1">
        hello
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild className="dropDownMenu p-1 m-1">
          <button>
            <CircleEllipsis />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="dropDownMenuContent">
          <DropdownMenuItem
            onSelect={() => console.log("Editar")}
            className="flex gap-2"
          >
            <LogOut />
            <button>Cerrar sesion</button>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => console.log("Eliminar")}
            className="flex gap-2"
          >
            <Settings />
            <button>Configuracion</button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
