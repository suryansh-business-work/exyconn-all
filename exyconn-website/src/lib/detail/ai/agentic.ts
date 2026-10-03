import { defineDetailPage } from "../schema";

/** Agentic AI — content for /[market]/ai/agentic. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "ai",
  slug: "agentic",
  name: "Agentic AI",
  meta: {
    title: "Agentic AI | Autonomous Intelligence for Business | Exyconn",
    description:
      "Discover Agentic AI solutions by Exyconn. Enable autonomous, adaptive, and collaborative AI agents for business automation, decision-making, and innovation.",
    keywords: "Agentic AI, autonomous AI, AI agents, business automation, adaptive AI, Exyconn",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Agentic AI that adapts, decides and acts",
    tagline: "Adapt. Decide. Act.",
    lede: "Empower your organization with Agentic AI—autonomous systems that perceive, learn, and act to achieve your business goals. Unlock new levels of automation, adaptability, and collaboration with next-generation AI agents.",
    action: {
      label: "Contact us",
      href: "/contact",
    },
  },
  intro: {
    title: "What is agentic AI?",
    icon: "brain",
    term: "Agentic AI",
    definition:
      "refers to artificial intelligence systems that act as autonomous agents—capable of perceiving their environment, making decisions, and taking actions to achieve specific goals. Unlike traditional AI, which often follows static rules or models, agentic AI adapts, learns, and collaborates, making it ideal for dynamic, real-world scenarios.",
  },
  benefits: {
    title: "Why do we need agentic AI?",
    items: [
      {
        icon: "bolt",
        text: "Automates complex, multi-step business processes.",
      },
      {
        icon: "arrows-rotate",
        text: "Adapts to changing environments and requirements.",
      },
      {
        icon: "money-bill-trend-up",
        text: "Reduces manual intervention and operational costs.",
      },
      {
        icon: "gauge-high",
        text: "Enables real-time decision-making and optimization.",
      },
      {
        icon: "lightbulb",
        text: "Drives innovation in customer service, logistics, finance, and more.",
      },
    ],
  },
  offerings: {
    title: "How does agentic AI solve my problem?",
    items: [
      {
        icon: "gears",
        title: "Process automation",
        text: "Automates repetitive and complex workflows, freeing up human resources for higher-value tasks.",
      },
      {
        icon: "brain",
        title: "Adaptive decision-making",
        text: "Learns from data and feedback to make smarter, context-aware decisions in real time.",
      },
      {
        icon: "users",
        title: "Collaboration & integration",
        text: "Works seamlessly with humans and other systems, integrating across platforms and teams.",
      },
    ],
  },
  tabs: {
    title: "Agentic AI types",
    items: [
      {
        label: "Reactive agents",
        summary: "Respond instantly to stimuli",
        text: "Reactive Agents act only on current input, without memory or internal state. They are fast and simple, ideal for straightforward, repetitive tasks.",
        points: [
          "Example: Basic chatbots, thermostat controls",
          "Strength: Speed and reliability in predictable environments",
          "Limitation: Cannot learn or adapt to new situations",
        ],
      },
      {
        label: "Deliberative agents",
        summary: "Plan actions using reasoning",
        text: "Deliberative Agents build internal models and plan before acting. They can handle complex scenarios by predicting outcomes and making informed decisions.",
        points: [
          "Example: Route-planning in autonomous vehicles",
          "Strength: Can solve complex, multi-step problems",
          "Limitation: Requires more computation and time",
        ],
      },
      {
        label: "Goal-based agents",
        summary: "Pursue explicit objectives",
        text: "Goal-Based Agents select actions that move them closer to defined goals, evaluating possible future states to make choices.",
        points: [
          "Example: Game-playing AIs (like chess engines)",
          "Strength: Flexible and adaptable to changing goals",
          "Limitation: Needs clear goal definitions",
        ],
      },
      {
        label: "Utility-based agents",
        summary: "Maximize overall benefit",
        text: "Utility-Based Agents weigh the desirability of outcomes, choosing actions that maximize their expected utility or satisfaction.",
        points: [
          "Example: Recommendation systems optimizing user satisfaction",
          "Strength: Can balance multiple objectives and trade-offs",
          "Limitation: Utility functions can be hard to define",
        ],
      },
      {
        label: "Learning agents",
        summary: "Adapt and improve over time",
        text: "Learning Agents use feedback to refine their behavior, improving performance as they gain experience.",
        points: [
          "Example: Self-improving chatbots, adaptive spam filters",
          "Strength: Can handle new, unseen situations",
          "Limitation: Needs data and training time",
        ],
      },
      {
        label: "Model-based reflex agents",
        summary: "Use internal world models",
        text: "Model-Based Reflex Agents maintain a simple internal model to handle partially observable environments, enabling more flexible responses.",
        points: [
          "Example: Smart home systems that track room occupancy",
          "Strength: More robust than simple reflex agents",
          "Limitation: Still limited by model complexity",
        ],
      },
      {
        label: "Multi-agent systems",
        summary: "Multiple agents working together",
        text: "Multi-Agent Systems involve several agents that interact, cooperate, or compete to solve distributed problems.",
        points: [
          "Example: Swarm robotics, distributed sensor networks",
          "Strength: Scalability and robustness",
          "Limitation: Coordination and communication overhead",
        ],
      },
      {
        label: "Autonomous agents",
        summary: "Operate independently",
        text: "Autonomous Agents make decisions and act without human intervention, adapting to their environment as needed.",
        points: [
          "Example: Self-driving cars, robotic vacuum cleaners",
          "Strength: Reduces need for human oversight",
          "Limitation: Must handle unexpected situations safely",
        ],
      },
      {
        label: "Embodied agents",
        summary: "Physical presence in the world",
        text: "Embodied Agents are robots or devices that interact with the physical world using sensors and actuators.",
        points: [
          "Example: Industrial robots, drones",
          "Strength: Can manipulate and sense the real world",
          "Limitation: Hardware constraints and maintenance",
        ],
      },
      {
        label: "Cognitive agents",
        summary: "Human-like reasoning",
        text: "Cognitive Agents use models inspired by human thought, enabling reasoning, learning, and problem-solving.",
        points: [
          "Example: Virtual assistants with memory and reasoning",
          "Strength: Can handle complex, ambiguous tasks",
          "Limitation: Computationally intensive",
        ],
      },
      {
        label: "Social agents",
        summary: "Interact with others",
        text: "Social Agents communicate and collaborate with humans or other agents, often used in assistants and collaborative tools.",
        points: [
          "Example: Customer service bots, negotiation agents",
          "Strength: Effective in team or user-facing roles",
          "Limitation: Needs advanced communication skills",
        ],
      },
      {
        label: "Planning agents",
        summary: "Develop and execute plans",
        text: "Planning Agents generate and adapt action sequences to achieve complex goals.",
        points: [
          "Example: Automated logistics and scheduling systems",
          "Strength: Can optimize for efficiency and resources",
          "Limitation: May struggle with highly dynamic environments",
        ],
      },
      {
        label: "Conversational agents",
        summary: "Engage in dialogue",
        text: "Conversational Agents interact with users via natural language, such as chatbots and virtual assistants.",
        points: [
          "Example: ChatGPT, Alexa, Google Assistant",
          "Strength: Natural, intuitive user interaction",
          "Limitation: May misunderstand context or intent",
        ],
      },
      {
        label: "Robotic agents",
        summary: "Autonomous robots",
        text: "Robotic Agents are physical robots capable of sensing, reasoning, and acting in the real world.",
        points: [
          "Example: Delivery robots, warehouse automation",
          "Strength: Can perform physical tasks at scale",
          "Limitation: Expensive and complex to deploy",
        ],
      },
      {
        label: "Software agents",
        summary: "Digital task automation",
        text: "Software Agents are programs that autonomously perform tasks in digital environments, like web crawlers or trading bots.",
        points: [
          "Example: Email filters, automated trading systems",
          "Strength: Fast, scalable, and tireless",
          "Limitation: Limited to digital environments",
        ],
      },
      {
        label: "BDI agents",
        summary: "Belief-Desire-Intention model",
        text: "BDI Agents use beliefs, desires, and intentions to make rational decisions and plan actions.",
        points: [
          "Example: Research prototypes, advanced planning bots",
          "Strength: Flexible and theoretically robust",
          "Limitation: Complex to implement and scale",
        ],
      },
      {
        label: "Evolutionary agents",
        summary: "Evolve and adapt",
        text: "Evolutionary Agents use evolutionary algorithms to adapt and improve their behavior or structure.",
        points: [
          "Example: AI for game strategy optimization",
          "Strength: Can discover novel solutions",
          "Limitation: May require many iterations to improve",
        ],
      },
      {
        label: "Mobile agents",
        summary: "Move across networks",
        text: "Mobile Agents can migrate between systems or network nodes to perform distributed tasks.",
        points: [
          "Example: Distributed monitoring tools",
          "Strength: Flexible deployment across systems",
          "Limitation: Security and coordination challenges",
        ],
      },
      {
        label: "Collaborative agents",
        summary: "Work in teams",
        text: "Collaborative Agents coordinate with others to solve problems that require teamwork.",
        points: [
          "Example: Multi-agent scheduling, swarm robotics",
          "Strength: Can solve problems beyond single-agent capability",
          "Limitation: Requires robust communication protocols",
        ],
      },
      {
        label: "Interface agents",
        summary: "Assist with software interfaces",
        text: "Interface Agents help users interact with applications, learning preferences and automating tasks.",
        points: [
          "Example: Personal assistants, smart UI helpers",
          "Strength: Improves user productivity and experience",
          "Limitation: Needs to learn user preferences accurately",
        ],
      },
      {
        label: "Rational agents",
        summary: "Maximize performance",
        text: "Rational Agents always choose actions that maximize their expected performance, given their knowledge.",
        points: [
          "Example: Automated bidding systems",
          "Strength: Consistent and goal-oriented",
          "Limitation: Dependent on quality of knowledge base",
        ],
      },
      {
        label: "Hybrid agents",
        summary: "Combine multiple approaches",
        text: "Hybrid Agents integrate features from different agent types to leverage their strengths.",
        points: [
          "Example: Self-driving cars (combining reactive and deliberative)",
          "Strength: Flexible and robust in complex environments",
          "Limitation: Increased system complexity",
        ],
      },
      {
        label: "Proactive agents",
        summary: "Take initiative",
        text: "Proactive Agents anticipate needs or problems and act in advance, not just in response to events.",
        points: [
          "Example: Predictive maintenance systems",
          "Strength: Prevents issues before they occur",
          "Limitation: Risk of acting on incorrect predictions",
        ],
      },
      {
        label: "Reactive-proactive hybrid agents",
        summary: "Balance reaction and initiative",
        text: "Reactive-Proactive Hybrid Agents combine immediate responses with proactive planning for flexible behavior.",
        points: [
          "Example: Advanced customer support bots",
          "Strength: Can handle both urgent and long-term needs",
          "Limitation: Complex to design and tune",
        ],
      },
    ],
  },
  architecture: {
    title: "An autonomous agent, layer by layer",
    layers: [
      {
        label: "Environment",
        nodes: ["Data", "Platforms", "People"],
      },
      {
        label: "Agent",
        nodes: ["Perceive", "Decide", "Act"],
      },
      {
        label: "Improvement",
        nodes: ["Learn", "Adapt"],
      },
      {
        label: "Oversight",
        nodes: ["Monitoring", "Human oversight"],
      },
    ],
  },
  demo: {
    kind: "trace",
    title: "agent · trace",
    caption: "An autonomous agent's loop: it perceives, decides, acts and learns from feedback.",
    steps: [
      {
        label: "Perceive",
        detail: "Its environment and the data around it",
      },
      {
        label: "Decide",
        detail: "Smarter, context-aware decisions in real time",
      },
      {
        label: "Act",
        detail: "Actions that move it towards a specific goal",
      },
      {
        label: "Learn",
        detail: "From data and feedback, adapting as it goes",
      },
    ],
  },
  faqs: [
    {
      question: "What makes Agentic AI different from traditional AI?",
      answer:
        "Agentic AI systems act autonomously, adapt to changing environments, and make decisions to achieve specific goals, unlike traditional AI which often follows static rules.",
    },
    {
      question: "Can Agentic AI work with my existing business systems?",
      answer:
        "Yes, Agentic AI can integrate with your current platforms and tools, enabling seamless automation and collaboration across your organization.",
    },
    {
      question: "Is Agentic AI safe and reliable?",
      answer:
        "With proper monitoring, high-quality data, and human oversight, Agentic AI can be both safe and reliable for business-critical applications.",
    },
    {
      question: "What are the first steps to adopt Agentic AI?",
      answer:
        "Start by identifying processes that benefit from autonomy, assess your data readiness, and launch pilot projects to measure impact before scaling.",
    },
  ],
  logos: {
    label: "Our business tools",
    keys: ["claude", "openai", "gemini"],
  },
  scene: { shapes: ["neuralCore"], data: { neuralCore: { modules: 8 } } },
});
