"use client";

import { useEffect, useMemo, useState } from "react";
import "../styles/husky.css";
import type { PetState } from "./CatPet";

type HuskyPetProps = {
  state: PetState;
  scale: number;
  stage: number;
  xp?: number;
};

const ASSET_BASE = "/assets/pet/husky";
/* =========================================================
   STAGE 1
   BABY HUSKY
   ========================================================= */

function StageOneHusky({
  state,
  scale,
}: {
  state: PetState;
  scale: number;
}) {
  const runFrames = useMemo(
    () => [
      "stage-1-run-1.png",
      "stage-1-run-2.png",
      "stage-1-run-3.png",
      "stage-1-run-2.png",
    ],
    []
  );

  const [runFrame, setRunFrame] = useState(0);
  const [blink, setBlink] = useState(false);
  const [milkFrame, setMilkFrame] = useState(0);

  useEffect(() => {
    if (state !== "walk") {
      setRunFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setRunFrame((current) => (current + 1) % runFrames.length);
    }, 135);

    return () => {
      window.clearInterval(timer);
    };
  }, [state, runFrames]);

  useEffect(() => {
    if (state !== "idle") {
      setBlink(false);
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;

    const scheduleBlink = () => {
      const delay = 1800 + Math.random() * 2400;

      blinkTimer = window.setTimeout(() => {
        setBlink(true);

        reopenTimer = window.setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 140);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer !== undefined) {
        window.clearTimeout(blinkTimer);
      }

      if (reopenTimer !== undefined) {
        window.clearTimeout(reopenTimer);
      }
    };
  }, [state]);

  useEffect(() => {
    if (state !== "eat") {
      setMilkFrame(0);
      return;
    }

    setMilkFrame(0);

    const timer = window.setInterval(() => {
      setMilkFrame((current) => (current === 0 ? 1 : 0));
    }, 850);

    return () => {
      window.clearInterval(timer);
    };
  }, [state]);

  let image = "stage-1-master.png";

  if (state === "walk") {
    image = runFrames[runFrame];
  } else if (state === "idle" && blink) {
    image = "stage-1-idle-blink.png";
  } else if (state === "eat") {
    image =
      milkFrame === 0
        ? "stage-1-milk.png"
        : "stage-1-milk-up.png";
  } else if (state === "happy") {
    image = "stage-1-happy.png";
  } else if (state === "evolve") {
    image = "stage-1-master.png";
  }

  return (
    <div
      className={`husky-full-frame husky-stage-1 husky-full-state-${state}`}
      style={{
        width: 420,
        height: 420,
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className="husky-full-shadow" />

      <img
        src={`${ASSET_BASE}/stage-1/${image}`}
        alt="Stage 1 Baby Siberian Husky"
        draggable={false}
        className="husky-full-image"
      />

      {state === "happy" && (
        <div className="husky-heart-zone" aria-hidden="true">
          <span className="husky-heart husky-heart-1">♥</span>
          <span className="husky-heart husky-heart-2">♥</span>
          <span className="husky-heart husky-heart-3">♥</span>
          <span className="husky-heart husky-heart-4">♥</span>
          <span className="husky-heart husky-heart-5">♥</span>
          <span className="husky-heart husky-heart-6">♥</span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STAGE 2
   GROWING HUSKY
   ========================================================= */

function StageTwoHusky({
  state,
  scale,
}: {
  state: PetState;
  scale: number;
}) {
  const runFrames = useMemo(
    () => [
      "stage-2-run-1.png",
      "stage-2-run-2.png",
      "stage-2-run-3.png",
      "stage-2-run-2.png",
    ],
    []
  );

  const eatFrames = useMemo(
    () => [
      "stage-2-eat-1.png",
      "stage-2-eat-2.png",
    ],
    []
  );

  const [runFrame, setRunFrame] = useState(0);
  const [eatFrame, setEatFrame] = useState(0);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (state !== "walk") {
      setRunFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setRunFrame((current) => (current + 1) % runFrames.length);
    }, 125);

    return () => {
      window.clearInterval(timer);
    };
  }, [state, runFrames]);

  useEffect(() => {
    if (state !== "idle") {
      setBlink(false);
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;

    const scheduleBlink = () => {
      const delay = 1800 + Math.random() * 2500;

      blinkTimer = window.setTimeout(() => {
        setBlink(true);

        reopenTimer = window.setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 135);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer !== undefined) {
        window.clearTimeout(blinkTimer);
      }

      if (reopenTimer !== undefined) {
        window.clearTimeout(reopenTimer);
      }
    };
  }, [state]);

  useEffect(() => {
    if (state !== "eat") {
      setEatFrame(0);
      return;
    }

    setEatFrame(0);

    const timer = window.setInterval(() => {
      setEatFrame((current) => (current + 1) % eatFrames.length);
    }, 620);

    return () => {
      window.clearInterval(timer);
    };
  }, [state, eatFrames]);

  let image = "stage-2-master.png";

  if (state === "walk") {
    image = runFrames[runFrame];
  } else if (state === "idle" && blink) {
    image = "stage-2-idle-blink.png";
  } else if (state === "eat") {
    image = eatFrames[eatFrame];
  } else if (state === "happy") {
    image = "stage-2-thank-you.png";
  } else if (state === "evolve") {
    image = "stage-2-master.png";
  }

  return (
    <div
      className={`husky-full-frame husky-stage-2-new husky-full-state-${state}`}
      style={{
        width: 440,
        height: 440,
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className="husky-full-shadow" />

      <img
        src={`${ASSET_BASE}/stage-2/${image}`}
        alt="Stage 2 Growing Siberian Husky"
        draggable={false}
        className="husky-full-image"
      />
    </div>
  );
}

/* =========================================================
   STAGE 3
   PLAYFUL YOUNG HUSKY

   idle   = master + blink
   walk   = playful pose
   eat    = rolling animation
   happy  = ball play animation
   evolve = big ball -> flash
   sleep  = master with sleep CSS
   ========================================================= */

function StageThreeHusky({
  state,
  scale,
}: {
  state: PetState;
  scale: number;
}) {
const runFrames = useMemo(
  () => [
    "stage-3-roll-1.png",
    "stage-3-roll-2.png",
    "stage-3-roll-3.png",
    "stage-3-roll-2.png",
  ],
  []
);

  const eatFrames = useMemo(
    () => [
      "stage-3-eat-1.png",
      "stage-3-eat-2.png",
    ],
    []
  );

  const [blink, setBlink] = useState(false);
  const [runFrame, setRunFrame] = useState(0);
  const [eatFrame, setEatFrame] = useState(0);

  useEffect(() => {
    if (state !== "idle") {
      setBlink(false);
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;

    const scheduleBlink = () => {
      const delay = 1800 + Math.random() * 2600;

      blinkTimer = window.setTimeout(() => {
        setBlink(true);

        reopenTimer = window.setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 140);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer !== undefined) {
        window.clearTimeout(blinkTimer);
      }

      if (reopenTimer !== undefined) {
        window.clearTimeout(reopenTimer);
      }
    };
  }, [state]);

  useEffect(() => {
    if (state !== "walk") {
      setRunFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setRunFrame((current) => (current + 1) % runFrames.length);
    }, 135);

    return () => {
      window.clearInterval(timer);
    };
  }, [state, runFrames]);

  useEffect(() => {
    if (state !== "eat") {
      setEatFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setEatFrame((current) => (current + 1) % eatFrames.length);
    }, 620);

    return () => {
      window.clearInterval(timer);
    };
  }, [state, eatFrames]);

  let image = "stage-3-master.png";

  if (state === "idle" && blink) {
    image = "stage-3-idle-blink.png";
  } else if (state === "walk") {
    image = runFrames[runFrame];
  } else if (state === "eat") {
    image = eatFrames[eatFrame];
  } else if (state === "happy") {
    image = "stage-3-thank-you.png";
  } else if (state === "sleep") {
    image = "stage-3-sleep.png";
  } else if (state === "evolve") {
    image = "stage-3-evolve-flash.png";
  }

  return (
    <div
      className={`husky-full-frame husky-stage-3-new husky-full-state-${state}`}
      style={{
        width: 460,
        height: 460,
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className="husky-full-shadow" />

      <img
        key={`${state}-${image}`}
        src={`${ASSET_BASE}/stage-3/${image}`}
        alt="Stage 3 Playful Young Siberian Husky"
        draggable={false}
        className="husky-full-image"
      />

      {state === "evolve" && (
        <div
          className="husky-stage-3-evolve-overlay husky-stage-3-evolve-overlay-active"
          aria-hidden="true"
        />
      )}
    </div>
  );
}


/* =========================================================
   STAGE 4
   ROYAL HUSKY
   ========================================================= */

function StageFourHusky({
  state,
  scale,
}: {
  state: PetState;
  scale: number;
}) {
  const walkFrames = useMemo(
    () => [
      "stage-4-walk-1.png",
      "stage-4-walk-2.png",
      "stage-4-walk-3.png",
      "stage-4-walk-4.png",
    ],
    []
  );

  const eatFrames = useMemo(
    () => ["stage-4-eat-1.png", "stage-4-eat-2.png"],
    []
  );

  const happyFrames = useMemo(
    () => [
      "stage-4-proud.png",
      "stage-4-crown.png",
      "stage-4-happy.png",
      "stage-4-crown.png",
    ],
    []
  );

  const [blink, setBlink] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const [eatFrame, setEatFrame] = useState(0);
  const [happyFrame, setHappyFrame] = useState(0);

  useEffect(() => {
    if (state !== "idle") {
      setBlink(false);
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        setBlink(true);
        reopenTimer = window.setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 145);
      }, 1900 + Math.random() * 2600);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer !== undefined) window.clearTimeout(blinkTimer);
      if (reopenTimer !== undefined) window.clearTimeout(reopenTimer);
    };
  }, [state]);

  useEffect(() => {
    if (state !== "walk") {
      setWalkFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setWalkFrame((current) => (current + 1) % walkFrames.length);
    }, 170);

    return () => window.clearInterval(timer);
  }, [state, walkFrames]);

  useEffect(() => {
    if (state !== "eat") {
      setEatFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setEatFrame((current) => (current + 1) % eatFrames.length);
    }, 520);

    return () => window.clearInterval(timer);
  }, [state, eatFrames]);

  useEffect(() => {
    if (state !== "happy") {
      setHappyFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setHappyFrame((current) => (current + 1) % happyFrames.length);
    }, 430);

    return () => window.clearInterval(timer);
  }, [state, happyFrames]);

  let image = "stage-4-master.png";

  if (state === "idle" && blink) {
    image = "stage-4-idle-blink.png";
  } else if (state === "walk") {
    image = walkFrames[walkFrame];
  } else if (state === "eat") {
    image = eatFrames[eatFrame];
  } else if (state === "happy") {
    image = happyFrames[happyFrame];
  } else if (state === "sleep") {
    image = "stage-4-sleep.png";
  } else if (state === "evolve") {
    image = "stage-4-evolve-flash.png";
  }

  return (
    <div
      className={`husky-full-frame husky-stage-4-new husky-full-state-${state}`}
      style={{
        width: 540,
        height: 540,
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className="husky-full-shadow" />

      <img
        key={`${state}-${image}`}
        src={`${ASSET_BASE}/stage-4/${image}`}
        alt="Stage 4 Royal Siberian Husky"
        draggable={false}
        className="husky-full-image"
      />

      {state === "happy" && happyFrame === 1 && (
        <div className="husky-stage-4-crown-glow" aria-hidden="true" />
      )}

      {state === "evolve" && (
        <div className="husky-stage-4-evolve-glow" aria-hidden="true" />
      )}
    </div>
  );
}

/* =========================================================
   STAGE 5
   LEGENDARY HUSKY — FULL FRAME
   ========================================================= */

function StageFiveHusky({
  state,
  scale,
}: {
  state: PetState;
  scale: number;
}) {
  const runFrames = useMemo(
    () => [
      "stage-5-run-1.png",
      "stage-5-run-2.png",
      "stage-5-run-3.png",
      "stage-5-run-4.png",
    ],
    []
  );

  const eatFrames = useMemo(
    () => ["stage-5-eat-1.png", "stage-5-eat-2.png"],
    []
  );

  const happyImages = useMemo(() => {
    const images = [
      "stage-5-happy.png",
      "stage-5-cool.png",
      "stage-5-suit.png",
      "stage-5-glasses.png",
      "stage-5-wai.png",
      "stage-5-wave.png",
    ];

    // Christmas costume appears automatically only in December.
    if (new Date().getMonth() === 11) {
      images.push("stage-5-christmas.png");
    }

    return images;
  }, []);

  const [blink, setBlink] = useState(false);
  const [runFrame, setRunFrame] = useState(0);
  const [eatFrame, setEatFrame] = useState(0);
  const [happyImage, setHappyImage] = useState("stage-5-happy.png");

  useEffect(() => {
    if (state !== "happy") {
      setHappyImage("stage-5-happy.png");
      return;
    }

    const randomIndex = Math.floor(Math.random() * happyImages.length);
    setHappyImage(happyImages[randomIndex]);
  }, [state, happyImages]);

  useEffect(() => {
    if (state !== "idle") {
      setBlink(false);
      return;
    }

    let blinkTimer: number | undefined;
    let reopenTimer: number | undefined;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        setBlink(true);

        reopenTimer = window.setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 150);
      }, 1900 + Math.random() * 2800);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer !== undefined) window.clearTimeout(blinkTimer);
      if (reopenTimer !== undefined) window.clearTimeout(reopenTimer);
    };
  }, [state]);

  useEffect(() => {
    if (state !== "walk") {
      setRunFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setRunFrame((current) => (current + 1) % runFrames.length);
    }, 145);

    return () => window.clearInterval(timer);
  }, [state, runFrames]);

  useEffect(() => {
    if (state !== "eat") {
      setEatFrame(0);
      return;
    }

    const timer = window.setInterval(() => {
      setEatFrame((current) => (current + 1) % eatFrames.length);
    }, 560);

    return () => window.clearInterval(timer);
  }, [state, eatFrames]);

  let image = "stage-5-master.png";

  if (state === "idle" && blink) {
    image = "stage-5-idle-blink.png";
  } else if (state === "walk") {
    image = runFrames[runFrame];
  } else if (state === "eat") {
    image = eatFrames[eatFrame];
  } else if (state === "happy") {
    image = happyImage;
  } else if (state === "sleep") {
    image = "stage-5-sleep.png";
  } else if (state === "evolve") {
    image = "stage-5-master.png";
  }

  return (
    <div
      className={`husky-full-frame husky-stage-5-new husky-full-state-${state}`}
      style={{
        width: 560,
        height: 560,
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className="husky-full-shadow" />

      <img
        key={`${state}-${image}`}
        src={`${ASSET_BASE}/stage-5/${image}`}
        alt="Stage 5 Legendary Siberian Husky"
        draggable={false}
        className="husky-full-image"
      />

      {state === "evolve" && (
        <>
          <div className="husky-stage-5-evolve-ring" aria-hidden="true" />
          <div className="husky-stage-5-evolve-sparkles" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   MAIN
   ========================================================= */

export function HuskyPet({
  state,
  scale,
  stage,
}: HuskyPetProps) {
  if (stage <= 1) {
    return <StageOneHusky state={state} scale={scale} />;
  }

  if (stage === 2) {
    return <StageTwoHusky state={state} scale={scale} />;
  }

  if (stage === 3) {
    return <StageThreeHusky state={state} scale={scale} />;
  }

  if (stage === 4) {
    return <StageFourHusky state={state} scale={scale} />;
  }

  return <StageFiveHusky state={state} scale={scale} />;
}