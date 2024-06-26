import React from "react";
import Contact from "@/components/ComponentsLandingPage/Contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Page",
};

const SupportPage = () => {
  return (
    <div className="pb-20 pt-40">
      <Contact />
    </div>
  );
};

export default SupportPage;
