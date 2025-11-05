
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import React from "react";

export interface RowActionsProps {
  onRename: () => void;
  onDelete: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function RowActions({
  onRename,
  onDelete,
  size = "sm",
  disabled = false,
}: RowActionsProps) {
  const btnSizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={btnSizeClass}
          disabled={disabled}
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename / Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
  