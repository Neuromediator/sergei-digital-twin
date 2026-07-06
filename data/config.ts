// Personalize your digital twin here. This is the one file (plus your PDF/TXT
// sources) you edit to change identity, links, greeting, and starter questions.

export type Social = {
  label: string;
  href: string;
};

export const config = {
  // Display name shown in the header and used by the twin to speak as you.
  name: "Sergei Maslennikov",

  // Short role/tagline (optional; shown under the name if you want — currently
  // used in the system prompt for context).
  title: "LLM Engineer / AI Practitioner",

  // First message the twin shows on load.
  greeting: "Hi there! I am Sergei. Feel free to ask me anything about my work!",

  // Path to your headshot in /public. Replace public/avatar.png with your photo.
  avatarSrc: "/avatar.png",

  // Contact / profile links. Shown as icons in the header and given to the twin
  // so it can share them when asked how to get in touch.
  socials: {
    linkedin: "https://www.linkedin.com/in/sergei-maslennikov-ai",
    github: "https://github.com/Neuromediator",
    huggingface: "https://huggingface.co/Neuromediator",
    email: "sergeimaslennikov89@gmail.com",
  },

  // Clickable starter questions (shown as chips while the chat is empty).
  suggestedQuestions: [
    "Tell me about your background and experience.",
    "What kinds of projects are you working on now?",
    "What are your strongest technical skills?",
    "How can I get in touch with you?",
  ],

  // Topics the twin is allowed to discuss. Anything outside this list gets a
  // polite redirect back to one of these.
  scopeTopics: [
    "education",
    "certifications",
    "work experience",
    "skills",
    "projects",
    "hobbies and interests",
    "contact information",
  ],
} as const;

export type AppConfig = typeof config;
