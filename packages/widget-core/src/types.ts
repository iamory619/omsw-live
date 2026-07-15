export type WidgetSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type WidgetSocketOptions = {
  serverUrl: string;
  overlayId: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
};

export type WidgetSettingsState<TSettings> = {
  settings: TSettings;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};
