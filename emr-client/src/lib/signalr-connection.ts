import * as signalR from '@microsoft/signalr';

type VitalsPayload = {
  patientId?: string;
  heartRate: number;
  spO2: number;
  temperature: number;
};

type VitalsCallback = (data: VitalsPayload) => void;
type AlertCallback = (patientId: string, alertMessage: string) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private patientSubscribers = new Map<string, Set<VitalsCallback>>();
  private alertSubscribers = new Set<AlertCallback>();
  private static instance: SignalRService;

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async ensureConnected(token?: string): Promise<signalR.HubConnection> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (!this.connection) {
      const endpoint =
        process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT || 'http://localhost:34732/hubs/telemetry';
      const builder = new signalR.HubConnectionBuilder();
      this.connection = (
        token ? builder.withUrl(endpoint, { accessTokenFactory: () => token }) : builder.withUrl(endpoint)
      )
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();

      this.connection.on('ReceiveVitals', (data: VitalsPayload) => {
        const targetId = data?.patientId?.toLowerCase();
        if (targetId) {
          this.patientSubscribers.get(targetId)?.forEach((cb) => cb(data));
        } else if (this.patientSubscribers.size === 1) {
          // Backwards-compatible fallback when only 1 patient stream is active
          const onlySet = this.patientSubscribers.values().next().value;
          onlySet?.forEach((cb) => cb(data));
        }
      });

      this.connection.on('ReceiveAlert', (patientId: string, alertMessage: string) => {
        this.alertSubscribers.forEach((cb) => cb(patientId, alertMessage));
      });

      this.connection.onreconnected(() => {
        this.patientSubscribers.forEach((_, pid) => {
          this.connection?.invoke('JoinPatientStream', pid).catch(() => {});
        });
      });
    }

    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      if (!this.startPromise) {
        this.startPromise = this.connection
          .start()
          .catch(() => {})
          .finally(() => {
            this.startPromise = null;
          });
      }
      await this.startPromise;
    } else if (this.startPromise) {
      await this.startPromise;
    }

    return this.connection;
  }

  public subscribePatientVitals(patientId: string, callback: VitalsCallback): () => void {
    const normalizedId = patientId.toLowerCase();
    let listeners = this.patientSubscribers.get(normalizedId);
    const isFirstForPatient = !listeners || listeners.size === 0;
    if (!listeners) {
      listeners = new Set();
      this.patientSubscribers.set(normalizedId, listeners);
    }
    listeners.add(callback);

    this.ensureConnected().then((conn) => {
      if (
        isFirstForPatient &&
        this.patientSubscribers.has(normalizedId) &&
        conn.state === signalR.HubConnectionState.Connected
      ) {
        conn.invoke('JoinPatientStream', patientId).catch(() => {});
      }
    });

    return () => {
      const set = this.patientSubscribers.get(normalizedId);
      if (!set) return;
      set.delete(callback);
      if (set.size === 0) {
        this.patientSubscribers.delete(normalizedId);
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
          this.connection.invoke('LeavePatientStream', patientId).catch(() => {});
        }
        this.maybeDisconnect();
      }
    };
  }

  public subscribeAlerts(callback: AlertCallback, onConnectedChange?: (connected: boolean) => void): () => void {
    this.alertSubscribers.add(callback);
    this.ensureConnected().then((conn) => {
      onConnectedChange?.(conn.state === signalR.HubConnectionState.Connected);
    });

    return () => {
      this.alertSubscribers.delete(callback);
      this.maybeDisconnect();
    };
  }

  private maybeDisconnect() {
    if (this.patientSubscribers.size === 0 && this.alertSubscribers.size === 0) {
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        this.connection.stop().catch(() => {});
      }
    }
  }
}

export const signalRService = SignalRService.getInstance();
