"use client";

import { useState, useEffect } from "react";
import PublicCardReviewForm from "@/components/reviewty/PublicCardReviewForm";

type Props = {
  publicCardSlug: string;
};

export default function PublicCardReviewFormClient({ publicCardSlug }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <PublicCardReviewForm publicCardSlug={publicCardSlug} />;
}

