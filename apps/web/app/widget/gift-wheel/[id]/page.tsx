"use client";

import { useParams } from "next/navigation";
import { GiftWheelEngine } from "@/components/widgets/gift-wheel/GiftWheelEngine";

export default function GiftWheelWidgetPage() {
  const params = useParams();
  const overlayId = params.id as string;

  return <GiftWheelEngine overlayId={overlayId} />;
}