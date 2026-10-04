import { useEffect, useState } from "react";
import { forgetDemoAccess, loadDemoAccess, saveDemoAccess } from "./demoAccessStore";
import { DemoLeadForm } from "./whatsapp-demo.form";
import { DemoCodeStep } from "./whatsapp-demo-code.step";
import { WhatsappDemoLive } from "./WhatsappDemoLive";
import type { DemoAccess } from "./whatsapp-demo.types";
import "./whatsapp-demo.css";

type Step =
  { kind: "lead" } | { kind: "code"; email: string } | { kind: "live"; access: DemoAccess };

/**
 * The live WhatsApp demo on the chatbot page: details → the emailed code → the demo running
 * right here (and full screen on its own site). A visitor who already verified in this browser
 * goes straight to the demo.
 */
export function WhatsappDemoAccess() {
  const [step, setStep] = useState<Step>({ kind: "lead" });

  // After mount, not during render: the server-rendered form is the same for every visitor.
  useEffect(() => {
    const access = loadDemoAccess();
    if (access) setStep({ kind: "live", access });
  }, []);

  if (step.kind === "live") {
    return (
      <WhatsappDemoLive
        access={step.access}
        onSignOut={() => {
          forgetDemoAccess();
          setStep({ kind: "lead" });
        }}
      />
    );
  }

  return (
    <div className="wa-access inner-panel">
      {step.kind === "code" ? (
        <DemoCodeStep
          email={step.email}
          onVerified={(access) => {
            saveDemoAccess(access);
            setStep({ kind: "live", access });
          }}
          onStartOver={() => setStep({ kind: "lead" })}
        />
      ) : (
        <DemoLeadForm onCodeSent={(email) => setStep({ kind: "code", email })} />
      )}
    </div>
  );
}
