export const WIDGET_EVENTS = {
  JOIN_OVERLAY: "join-overlay",

  TEST_GOAL: "test-goal",
  RESET_GOAL: "reset-goal",
  GOAL_GIFT: "goal-gift",

  TEST_LANTERN: "test-lantern",
  RESET_LANTERN: "reset-lantern",
  LANTERN_GIFT: "lantern-gift",

  TEST_VEHICLE: "test-vehicle",
  RESET_VEHICLE: "reset-vehicle",
  VEHICLE_GIFT: "vehicle-gift",

  TEST_FORTUNE: "test-fortune",
  RESET_FORTUNE: "reset-fortune",
  FORTUNE_GIFT: "fortune-gift",

  TEST_WHEEL: "test-wheel",
  RESET_WHEEL: "reset-wheel",
  WHEEL_GIFT: "wheel-gift",
} as const;

export type WidgetEventName =
  (typeof WIDGET_EVENTS)[keyof typeof WIDGET_EVENTS];
