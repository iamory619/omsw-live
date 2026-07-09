"use client";

import { useParams, useSearchParams } from "next/navigation";
import { BasketEngine } from "@/components/widgets/basket/BasketEngine";

export default function GiftPlaneWidget() {
  const params = useParams();
  const searchParams = useSearchParams();

  const overlayId = params.id as string;
  const basketId = searchParams.get("basket") || "basket-1";

  return <BasketEngine overlayId={overlayId} basketId={basketId} />;
}