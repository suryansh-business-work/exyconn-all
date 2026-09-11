import React, { useState } from "react";

const agents = [
  {
    id: 1,
    name: "Sales Automation Agent",
    description: "Automate your sales pipeline and follow-ups with advanced AI workflows.",
  },
  {
    id: 2,
    name: "Customer Support Agent",
    description: "Deliver 24/7 AI-powered customer support with seamless handoff to humans.",
  },
  {
    id: 3,
    name: "Data Entry Agent",
    description: "Eliminate repetitive data entry with intelligent extraction and validation.",
  },
  {
    id: 4,
    name: "Marketing Automation Agent",
    description: "Boost campaigns and lead generation with adaptive AI strategies.",
  },
  {
    id: 5,
    name: "HR Onboarding Agent",
    description: "Accelerate onboarding and HR tasks with smooth, automated AI processes.",
  },
];

export default function OrderAgents() {
  const [itemList, setItemList] = useState([]);

  const addAgent = (agent) => {
    if (!itemList.find((a) => a.id === agent.id)) {
      setItemList([...itemList, agent]);
    }
  };

  const removeAgent = (agentId) => {
    setItemList(itemList.filter((a) => a.id !== agentId));
  };

  const submitOrder = () => {
    if (itemList.length === 0) {
      alert("Please add at least one agent to your suite.");
      return;
    }
    alert("Suite request submitted! (Demo only)");
    // Implement actual order submission logic here.
  };

  return (
    <section className="max-w-5xl mx-auto my-16 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-fg-strong mb-2 drop-shadow-lg tracking-tight">
          Build Your AI Agent Suite
        </h1>
        <p className="text-lg md:text-xl text-fg-secondary font-light">
          Select from our professional, production-ready AI agents and create a custom automation
          toolkit for your business.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Agents List */}
        <div className="bg-surface rounded-2xl shadow-lg p-8 flex flex-col gap-4 animate-fade-in-up w-full">
          <h3 className="text-xl font-semibold text-indigo-fg-strong mb-4">Available AI Agents</h3>
          <ul className="flex flex-col gap-4">
            {agents.map((agent) => (
              <li className="border rounded-lg p-4 flex flex-col gap-2" key={agent.id}>
                <span className="font-bold text-indigo-fg-strong">{agent.name}</span>
                <span className="text-fg-muted text-sm">{agent.description}</span>
                <button
                  className="mt-2 bg-indigo-deep text-on-solid px-4 py-2 rounded hover:bg-indigo-strong transition w-max"
                  onClick={() => addAgent(agent)}
                  disabled={!!itemList.find((a) => a.id === agent.id)}
                >
                  {itemList.find((a) => a.id === agent.id) ? "Added" : "Add to Suite"}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Item List */}
        <div className="bg-surface rounded-2xl shadow-lg p-8 flex flex-col gap-4 animate-fade-in-up w-full">
          <h3 className="text-xl font-semibold text-indigo-fg-strong mb-4">Your AI Suite</h3>
          <ul className="flex flex-col gap-4">
            {itemList.length === 0 ? (
              <li className="text-fg-faint">No agents added yet.</li>
            ) : (
              itemList.map((agent) => (
                <li className="border rounded-lg p-4 flex flex-col gap-1" key={agent.id}>
                  <span className="font-bold text-indigo-fg-strong">{agent.name}</span>
                  <span className="text-fg-muted text-sm">{agent.description}</span>
                  <button
                    className="mt-2 text-red-fg hover:underline"
                    onClick={() => removeAgent(agent.id)}
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            className="mt-4 bg-green-strong text-on-solid px-6 py-2 rounded hover:bg-green-deep transition w-max self-end"
            onClick={submitOrder}
          >
            Submit Suite Request
          </button>
        </div>
      </div>
    </section>
  );
}
