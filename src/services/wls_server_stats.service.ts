import { GameDig } from 'gamedig';

export interface SquadPlayer {
  name: string;
  raw?: Record<string, unknown>;
}

export interface SquadServerData {
  name: string;
  map: string;
  players: number;
  maxPlayers: number;
  ping: number;
  isOnline: boolean;
  playerList: string[];
  rawSquadDetails?: {
    teamOne?: string;
    teamTwo?: string;
  };
}

export class SquadServerService {
  private cache: SquadServerData | null = null;
  private lastFetch = 0;
  private readonly ttlMs: number;

  constructor(
    private readonly host: string,
    // Squad's EOS-based query needs the actual game port, not the old Steam query port (27165).
    private readonly queryPort: number = 7787,
    cacheTtlSeconds: number = 5
  ) {
    this.ttlMs = cacheTtlSeconds * 1000;
  }

  public async getServerStatus(): Promise<SquadServerData> {
    const now = Date.now();

    // Frischen Cache zurückgeben, falls vorhanden
    if (this.cache && now - this.lastFetch < this.ttlMs) {
      return this.cache;
    }

    try {
      const response = await GameDig.query({
        type: 'squad',
        host: this.host,
        port: this.queryPort,
        socketTimeout: 3000, // 3 Sekunden Timeout für UDP
      });

      // Squad liefert Teams und Layer-Details in raw.attributes (EOS-Session-Objekt)
      const rawAttributes = (response.raw as Record<string, unknown>)?.attributes as
        | Record<string, string>
        | undefined;

      const freshData: SquadServerData = {
        name: response.name,
        map: response.map,
        players: response.numplayers,
        maxPlayers: response.maxplayers,
        ping: response.ping,
        isOnline: true,
        playerList: response.players
          .map((p) => p.name)
          .filter((name: unknown): name is string => typeof name === 'string' && Boolean(name)),
        rawSquadDetails: {
          teamOne: rawAttributes?.TEAMONE_s,
          teamTwo: rawAttributes?.TEAMTWO_s,
        },
      };

      this.cache = freshData;
      this.lastFetch = now;
      return freshData;
    } catch (error) {
      // Wenn der Server temporär nicht antwortet, aber ein Cache existiert:
      if (this.cache) {
        return {
          ...this.cache,
          isOnline: false,
        };
      }

      // Fallback, wenn der Server von Beginn an nicht erreichbar ist
      return {
        name: 'Offline / Nicht erreichbar',
        map: '-',
        players: 0,
        maxPlayers: 0,
        ping: 0,
        isOnline: false,
        playerList: [],
      };
    }
  }
}

// IP und Game-Port deines Squad-Servers (EOS-Abfrage braucht den Game-Port, nicht den alten Steam-Query-Port 27165)
export const squadService = new SquadServerService('178.63.27.87', 7787);
