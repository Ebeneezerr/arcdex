import { ethers, Contract } from "ethers";
import { isValidAddress } from './contractUtils';

export interface PointsEvent {
  user: string;
  points: bigint;
  module: number;
  timestamp: number;
  transactionHash: string;
}

export interface FaucetEvent {
  user: string;
  tokenA: bigint;
  tokenB: bigint;
  timestamp: number;
  claimed: boolean;
}

export interface ReputationUpdate {
  user: string;
  newReputation: bigint;
  penalty: bigint;
  timestamp: number;
}

export class AstroDEXAnalyticsListener {
  private pointsTracker: Contract | null = null;
  private faucet: Contract | null = null;
  private demoTrading: Contract | null = null;
  private provider: ethers.Provider | null = null;
  private isListening = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.listeners.set("pointsAwarded", []);
    this.listeners.set("faucetClaimed", []);
    this.listeners.set("reputationUpdated", []);
    this.listeners.set("abuseDetected", []);
  }

  async initialize(
    providerUrl: string,
    pointsTrackerAddress?: string,
    faucetAddress?: string,
    demoTradingAddress?: string,
    moduleEventSources: string[] = []
  ) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);

    const POINTS_TRACKER_ABI = [
      "event PointsAwarded(address indexed user, uint256 points, uint8 indexed module)",
      "event ReputationUpdated(address indexed user, uint256 newReputation, uint256 penalty)",
    ];

    const FAUCET_ABI = [
      "event FaucetRequested(address indexed user, uint256 tokenA, uint256 tokenB)",
    ];

    const DEMO_TRADING_ABI = [
      "event ActionRecorded(address indexed user, uint8 indexed module, uint256 points)",
    ];

    const eventSources = new Set(moduleEventSources);

    if (pointsTrackerAddress && eventSources.has("pointsTracker")) {
      if (isValidAddress(pointsTrackerAddress)) {
        this.pointsTracker = new ethers.Contract(
          pointsTrackerAddress,
          POINTS_TRACKER_ABI,
          this.provider
        );
      } else {
        console.warn('Invalid pointsTracker address, skipping listener:', pointsTrackerAddress);
      }
    }

    if (faucetAddress && eventSources.has("faucet")) {
      if (isValidAddress(faucetAddress)) {
        this.faucet = new ethers.Contract(faucetAddress, FAUCET_ABI, this.provider);
      } else {
        console.warn('Invalid faucet address, skipping listener:', faucetAddress);
      }
    }

    if (demoTradingAddress && eventSources.has("demoTrading")) {
      if (isValidAddress(demoTradingAddress)) {
        this.demoTrading = new ethers.Contract(
          demoTradingAddress,
          DEMO_TRADING_ABI,
          this.provider
        );
      } else {
        console.warn('Invalid demoTrading address, skipping listener:', demoTradingAddress);
      }
    }
  }

  async startListening() {
    if (this.isListening) {
      throw new Error("Already listening");
    }

    if (!this.provider) {
      throw new Error("Not initialized");
    }

    const hasPointsTracker = Boolean(this.pointsTracker);
    const hasFaucet = Boolean(this.faucet);
    const hasDemoTrading = Boolean(this.demoTrading);

    if (!hasPointsTracker && !hasFaucet && !hasDemoTrading) {
      throw new Error("No event sources configured for listening");
    }

    this.isListening = true;

    if (hasPointsTracker && this.pointsTracker) {
      this.pointsTracker.on("PointsAwarded", (user, points, module, event) => {
        const pointsEvent: PointsEvent = {
          user,
          points: BigInt(points),
          module: Number(module),
          timestamp: Date.now(),
          transactionHash: event.transactionHash,
        };

        this.emit("pointsAwarded", pointsEvent);
      });

      this.pointsTracker.on("ReputationUpdated", (user, newRep, penalty, event) => {
        const repEvent: ReputationUpdate = {
          user,
          newReputation: BigInt(newRep),
          penalty: BigInt(penalty),
          timestamp: Date.now(),
        };

        this.emit("reputationUpdated", repEvent);
      });
    }

    if (hasFaucet && this.faucet) {
      this.faucet.on("FaucetRequested", (user, tokenA, tokenB, event) => {
        const faucetEvent: FaucetEvent = {
          user,
          tokenA: BigInt(tokenA),
          tokenB: BigInt(tokenB),
          timestamp: Date.now(),
          claimed: true,
        };

        this.emit("faucetClaimed", faucetEvent);
      });
    }

    if (hasDemoTrading && this.demoTrading) {
      this.demoTrading.on("ActionRecorded", (user, module, points, event) => {
        const pointsEvent: PointsEvent = {
          user,
          points: BigInt(points),
          module: Number(module),
          timestamp: Date.now(),
          transactionHash: event.transactionHash,
        };

        this.emit("pointsAwarded", pointsEvent);
      });
    }


    console.log("Event listeners started");
  }

  stopListening() {
    if (this.pointsTracker) {
      this.pointsTracker.removeAllListeners();
    }
    if (this.faucet) {
      this.faucet.removeAllListeners();
    }
    if (this.demoTrading) {
      this.demoTrading.removeAllListeners();
    }
    this.isListening = false;

    console.log("Event listeners stopped");
  }

  on(eventName: string, callback: Function) {
    const callbacks = this.listeners.get(eventName) || [];
    callbacks.push(callback);
    this.listeners.set(eventName, callbacks);
  }

  off(eventName: string, callback: Function) {
    const callbacks = this.listeners.get(eventName) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  private emit(eventName: string, data: any) {
    const callbacks = this.listeners.get(eventName) || [];
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventName} callback:`, error);
      }
    });
  }
}

// Global listener instance
let globalListener: AstroDEXAnalyticsListener | null = null;

export function getAnalyticsListener(): AstroDEXAnalyticsListener {
    if (!globalListener) {
        globalListener = new AstroDEXAnalyticsListener();
  }
  return globalListener;
}
