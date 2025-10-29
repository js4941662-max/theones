import type { LinkedInReplyOutput } from './types';

export const fallbackData: LinkedInReplyOutput = {
  analysis: {
    originalPostSummary: "A summary of a post discussing the impact of AI on software development productivity.",
    authorIntent: "To share insights and spark discussion on AI-driven development.",
    targetAudience: "Software engineers, tech leads, and product managers.",
    conversationGap: "Adding a concrete, personal experience to ground the abstract discussion.",
    recommendedLength: "medium (150-200 words)",
    recommendedTone: "Analytical-Thoughtful",
    includeSources: "no, personal experience is more impactful here",
    strategicApproach: "Agree with the premise, add a specific personal anecdote to add value, and ask an open-ended question to encourage further engagement."
  },
  reply: {
    text: `This is a fascinating take on AI's role in development productivity. Your point about AI handling boilerplate code really hits home.

I recently experienced this on a project where we used a code assistant to generate unit tests and data models. It cut our initial setup time by nearly 40%, freeing up the team to focus on complex business logic and system architecture—the parts of the job that require deep human expertise. The tool didn't replace our engineers; it amplified their capabilities.

It's less about human vs. machine and more about a human-machine partnership.

Have you found certain types of development tasks benefit more from this AI partnership than others?`,
    wordCount: 138,
    emoji: "",
    sources: []
  },
  qualityScore: {
    valueAdd: "9/10 - Provides a real-world example and quantifiable metric (40% time saving).",
    engagementPotential: "9/10 - Asks a specific, open-ended question that invites detailed responses.",
    toneAlignment: "10/10 - Matches the thoughtful and analytical tone of a tech discussion.",
    credibility: "8/10 - Builds credibility through a specific, believable anecdote.",
    overall: "9.0/10",
    risks: ["The 40% metric could be challenged, but it's presented as personal experience."],
    improvements: ["Could bold the phrase **'amplified their capabilities'** to make the key insight stand out."]
  },
  alternativeVersions: {
    shorter: "Great point on AI handling boilerplate. We used recently used a code assistant for unit tests and it cut our setup time significantly, letting us focus on core logic. It's truly a human-machine partnership. What tasks have you seen benefit most?",
    longer: "This is a fascinating take... I recently experienced this on a project where we used a code assistant... It cut our initial setup time by nearly 40%... This shift allowed our senior developers to dedicate their time to architectural decisions and mentoring junior engineers, an ROI that's harder to quantify but incredibly valuable. It's less about human vs. machine and more about a human-machine partnership. Have you found certain types of development tasks benefit more from this AI partnership than others, for example, frontend UI generation versus backend algorithm optimization?",
    differentTone: "Totally agree! It's amazing to see AI assistants crush the boring stuff. We used one on our last project and it felt like a superpower, letting us skip straight to the fun, creative problems. It's a game-changer for team morale! 🚀"
  },
  isDemonstration: true
};
