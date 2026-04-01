"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "toast-custom group-[.toaster]:glass-toast group-[.toaster]:border-none",
          description: "group-[.toast]:text-[#003630]/70 group-[.toast]:text-[14px]",
          actionButton: "group-[.toast]:bg-[#95e36c] group-[.toast]:text-[#003630] group-[.toast]:font-['IBM_Plex_Sans:SemiBold',sans-serif] group-[.toast]:rounded-[8px] group-[.toast]:px-[12px] group-[.toast]:py-[6px] group-[.toast]:shadow-sm hover:group-[.toast]:bg-[#7bc858] group-[.toast]:transition-all",
          cancelButton: "group-[.toast]:bg-[#f5f4f7] group-[.toast]:text-[#003630] group-[.toast]:font-['IBM_Plex_Sans:Medium',sans-serif] group-[.toast]:rounded-[8px] group-[.toast]:px-[12px] group-[.toast]:py-[6px] hover:group-[.toast]:bg-[#e8e7ea]",
          success: "group-[.toast]:toast-success",
          error: "group-[.toast]:toast-error",
          info: "group-[.toast]:toast-info",
          warning: "group-[.toast]:toast-warning",
          title: "group-[.toast]:text-[15px] group-[.toast]:font-['IBM_Plex_Sans:SemiBold',sans-serif] group-[.toast]:text-[#003630]",
          closeButton: "group-[.toast]:bg-white/50 group-[.toast]:border-[#003630]/10 group-[.toast]:text-[#003630] group-[.toast]:hover:bg-white/80",
        },
        duration: 3000,
        style: {
          fontFamily: "'IBM Plex Sans', sans-serif",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
