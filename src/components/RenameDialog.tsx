"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface RenameDialogProps {
  open: boolean;
  title?: string;
  initial?: string;
  label?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function RenameDialog({
  open,
  title = "Rename",
  initial = "",
  label = "Name",
  onSave,
  onCancel,
}: RenameDialogProps) {
  const [name, setName] = useState<string>(initial || "");
  const inputId = useId();

  useEffect(() => {
    setName(initial || "");
  }, [initial, open]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) onCancel();
    },
    [onCancel]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;
      onSave(trimmed);
    },
    [name, onSave]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Update the {label.toLowerCase()} below.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <Label htmlFor={inputId}>{label}</Label>
            <Input
              id={inputId}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a new name"
            />
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
