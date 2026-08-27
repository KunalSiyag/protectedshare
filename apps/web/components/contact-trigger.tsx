"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ContactModal = dynamic(() => import("../app/contact-modal"), { ssr: false });

type ContactTriggerProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ContactTrigger({ className, children }: ContactTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open ? <ContactModal isOpen={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
