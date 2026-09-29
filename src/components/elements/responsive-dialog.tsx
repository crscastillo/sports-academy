"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

/** Opens `children` in a centered Dialog on desktop, or a bottom Drawer on mobile. */
export function ResponsiveDialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: {
  trigger: ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogTrigger render={trigger} />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      <DrawerTrigger render={trigger} />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
