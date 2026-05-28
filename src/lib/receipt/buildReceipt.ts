import type {
  AdCandidate,
  PromptSafetyResult,
  TransparencyReceipt,
} from "@/lib/types";

interface BuildReceiptInput {
  promptSafety: PromptSafetyResult;
  intent: string;
  monetisable: boolean;
  adRequestMade: boolean;
  winner: AdCandidate | null;
  candidates: AdCandidate[];
  auctionSuppressed: boolean;
  noSafeAds: boolean;
}

export function buildReceipt(input: BuildReceiptInput): TransparencyReceipt {
  const {
    promptSafety,
    intent,
    monetisable,
    adRequestMade,
    winner,
    candidates,
    auctionSuppressed,
    noSafeAds,
  } = input;

  const dataUsed = [
    "Current prompt",
    "Derived intent",
    "Placement context",
  ];

  const dataStored = auctionSuppressed
    ? ["Suppression event only", "Coarse intent label", "Safety decision"]
    : [
        "Coarse intent label",
        "Impression ID",
        "Safety decision",
        "Attribution events",
      ];

  const dataNotStored = [
    "Full conversation history",
    "Raw sensitive prompt",
    "Personal profile",
  ];

  if (auctionSuppressed) {
    return {
      placementDecision: "Suppressed",
      intent,
      monetisable,
      adRequestMade,
      whyThisAdWon: [],
      whyOthersLost: [],
      dataUsed,
      dataStored,
      dataNotStored,
      suppressionReason: promptSafety.reason,
    };
  }

  if (noSafeAds || !winner) {
    const blocked = candidates.filter((c) => c.status === "blocked");
    return {
      placementDecision: "Suppressed",
      intent,
      monetisable,
      adRequestMade,
      whyThisAdWon: [],
      whyOthersLost: blocked.map(
        (c) => `${c.advertiser}: ${c.reason || "Blocked by policy"}`
      ),
      dataUsed,
      dataStored: ["Impression ID", "Safety decision", "No-ad decision"],
      dataNotStored,
      suppressionReason: "No eligible candidates passed safety gates",
    };
  }

  const losers = candidates.filter(
    (c) => c.id !== winner.id && (c.status === "lost" || c.status === "blocked")
  );

  const whyThisAdWon = [
    "Highest eligible relevance among survivors",
    "Passed all safety and claim checks",
    "Bid within policy — bid cannot override safety",
  ];

  const whyOthersLost = losers.map((c) => {
    if (c.status === "blocked") {
      return `${c.advertiser}: ${c.reason}`;
    }
    if (c.id === "hyperbooks") {
      return `${c.advertiser}: Unsupported performance claim`;
    }
    if (c.relevanceScore < winner.relevanceScore) {
      return `${c.advertiser}: Lower relevance`;
    }
    return `${c.advertiser}: ${c.reason || "Lower composite score"}`;
  });

  return {
    placementDecision: "Served",
    intent,
    monetisable,
    adRequestMade,
    whyThisAdWon,
    whyOthersLost,
    dataUsed,
    dataStored,
    dataNotStored,
    winnerAdvertiser: winner.advertiser,
  };
}
