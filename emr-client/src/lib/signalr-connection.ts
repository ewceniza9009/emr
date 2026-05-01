import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private static instance: SignalRService;

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async startConnection(token: string) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT || 'http://localhost:5000/hubs/telemetry', {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    try {
      await this.connection.start();
    } catch (err) {
      setTimeout(() => this.startConnection(token), 5000);
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void) {
    this.connection?.on(eventName, callback);
  }

  public off(eventName: string, callback: (...args: any[]) => void) {
    this.connection?.off(eventName, callback);
  }

  public stopConnection() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      this.connection.stop();
    }
  }
}

export const signalRService = SignalRService.getInstance();
