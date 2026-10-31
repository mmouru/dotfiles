/**
 * Mermaid Diagram Extension
 *
 * Registers a /mermaid command and a mermaid_diagram tool that lets the LLM
 * produce beautiful Mermaid diagrams embedded in Markdown files.
 *
 * Usage (slash command):
 *   /mermaid flowchart showing how a user logs in
 *   /mermaid sequence diagram for an OAuth flow
 *   /mermaid ERD for a blog database
 *   /mermaid class diagram for a payment system
 *   /mermaid Gantt chart for a 3-week sprint
 *   /mermaid mindmap for machine learning concepts
 *   /mermaid timeline of the Apollo program
 *   /mermaid git graph for a feature-branch workflow
 *
 * The LLM will call the mermaid_diagram tool to write the diagram to a
 * Markdown file (default: diagram.md in the current directory).
 *
 * Place this file at:  ~/.pi/agent/extensions/mermaid.ts
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

// ─── Diagram type catalogue ──────────────────────────────────────────────────

const DIAGRAM_TYPES = [
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "gantt",
  "pie",
  "mindmap",
  "timeline",
  "gitGraph",
  "journey",
  "quadrantChart",
  "xychart-beta",
  "block-beta",
  "sankey-beta",
  "architecture-beta",
] as const;

type DiagramType = (typeof DIAGRAM_TYPES)[number];

// ─── System prompt snippet injected when the tool is active ─────────────────

const PROMPT_GUIDELINES = [
  "Use mermaid_diagram when the user asks for any diagram, chart, graph, flowchart, ERD, sequence diagram, Gantt chart, mindmap, or timeline.",
  "Always pick the most expressive Mermaid diagram type for the concept.",
  "Write clean, valid Mermaid syntax — test that node IDs contain no spaces or special characters.",
  "For flowcharts use LR (left-right) or TD (top-down) direction based on the content.",
  "For sequence diagrams add `autonumber` when there are more than 3 participants.",
  "For class diagrams include cardinality on relationships (1..*, 0..1, etc.).",
  "For ER diagrams use crow's-foot notation (||--|{, }|..||, etc.).",
  "For Gantt charts always include a dateFormat and at least one section.",
  "Add a brief comment (using %% syntax) at the top of every diagram describing its purpose.",
  "After writing the file, summarise what the diagram shows in 2–3 sentences.",
];

// ─── Beautiful wrapper that produces a polished Markdown file ────────────────

function buildMarkdownFile(
  title: string,
  description: string,
  diagramType: DiagramType,
  mermaidCode: string
): string {
  const now = new Date().toISOString().split("T")[0];
  const clean = mermaidCode.trim();

  return `# ${title}

> ${description}

\`\`\`mermaid
${clean}
\`\`\`

---
*Generated on ${now} · diagram type: \`${diagramType}\`*
`;
}

// ─── Extension factory ────────────────────────────────────────────────────────

export default function mermaidExtension(pi: ExtensionAPI) {
  // ── 1. Custom tool the LLM can call ────────────────────────────────────────
  pi.registerTool({
    name: "mermaid_diagram",
    label: "Mermaid Diagram",
    description:
      "Write a beautiful Mermaid diagram to a Markdown file. " +
      "Use this whenever the user requests any diagram, chart, flowchart, " +
      "sequence diagram, class diagram, ERD, Gantt chart, mindmap, timeline, " +
      "or git graph.",
    promptSnippet: "Write Mermaid diagrams to Markdown files",
    promptGuidelines: PROMPT_GUIDELINES,

    parameters: Type.Object({
      title: Type.String({
        description: "Human-readable title for the diagram (used as the Markdown H1 heading).",
      }),
      description: Type.String({
        description: "One-sentence description of what the diagram represents (shown as a blockquote).",
      }),
      diagramType: Type.Union(
        DIAGRAM_TYPES.map((t) => Type.Literal(t)),
        {
          description:
            "Mermaid diagram type keyword. " +
            "Examples: flowchart, sequenceDiagram, classDiagram, erDiagram, gantt, " +
            "mindmap, timeline, gitGraph, pie, stateDiagram-v2, journey.",
        }
      ),
      mermaidCode: Type.String({
        description:
          "Complete, valid Mermaid diagram code. " +
          "Do NOT wrap it in triple-backtick fences — the tool adds those automatically. " +
          "Start directly with the diagram type keyword (e.g. 'flowchart LR' or 'sequenceDiagram').",
      }),
      outputPath: Type.Optional(
        Type.String({
          description:
            "Relative or absolute path where the Markdown file should be written. " +
            "Defaults to 'diagram.md' in the current working directory. " +
            "Example: 'docs/auth-flow.md' or '/home/user/notes/Obsidian/diagrams/login.md'.",
        })
      ),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const {
        title,
        description,
        diagramType,
        mermaidCode,
        outputPath = "diagram.md",
      } = params;

      // Resolve to absolute path
      const absPath = resolve(ctx.cwd, outputPath);

      onUpdate?.({
        content: [{ type: "text", text: `Writing diagram to ${absPath} …` }],
      });

      try {
        // Ensure directory exists
        mkdirSync(dirname(absPath), { recursive: true });

        const markdown = buildMarkdownFile(
          title,
          description,
          diagramType as DiagramType,
          mermaidCode
        );

        writeFileSync(absPath, markdown, "utf8");

        return {
          content: [
            {
              type: "text",
              text:
                `✅ Diagram written to \`${absPath}\`\n\n` +
                `**Type:** ${diagramType}\n` +
                `**Title:** ${title}\n\n` +
                "The file contains a self-contained Markdown document with an embedded Mermaid code block. " +
                "It renders in Obsidian, GitHub, GitLab, and any Mermaid-aware Markdown viewer.",
            },
          ],
          details: {
            path: absPath,
            diagramType,
            title,
            linesOfCode: mermaidCode.split("\n").length,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `❌ Failed to write diagram: ${message}` }],
          isError: true,
          details: { error: message },
        };
      }
    },
  });

  // ── 2. /mermaid slash command ───────────────────────────────────────────────
  pi.registerCommand("mermaid", {
    description:
      "Generate a Mermaid diagram. Describe what you want, e.g. " +
      "/mermaid sequence diagram for a login flow",

    getArgumentCompletions: (prefix) => {
      const suggestions = [
        { value: "flowchart showing ", label: "flowchart showing …" },
        { value: "sequence diagram for ", label: "sequence diagram for …" },
        { value: "class diagram for ", label: "class diagram for …" },
        { value: "ERD for ", label: "ER diagram for …" },
        { value: "Gantt chart for ", label: "Gantt chart for …" },
        { value: "mindmap for ", label: "mindmap for …" },
        { value: "timeline of ", label: "timeline of …" },
        { value: "git graph showing ", label: "git graph showing …" },
        { value: "state diagram for ", label: "state diagram for …" },
        { value: "pie chart of ", label: "pie chart of …" },
        { value: "journey map for ", label: "user journey map for …" },
      ];
      const filtered = suggestions.filter((s) => s.value.startsWith(prefix));
      return filtered.length > 0 ? filtered : null;
    },

    handler: async (args, ctx) => {
      const topic = args.trim();

      if (!topic) {
        ctx.ui.notify(
          "Usage: /mermaid <description>  e.g. /mermaid flowchart for a CI/CD pipeline",
          "info"
        );
        return;
      }

      // Ask for output path so the user can point straight at Obsidian vault
      const defaultPath = "diagram.md";
      const outputPath = await ctx.ui.input(
        "Output file path",
        `Where should the Markdown file be saved? (relative or absolute)\nDefault: ${defaultPath}`,
        defaultPath
      );

      const finalPath = (outputPath ?? defaultPath).trim() || defaultPath;

      // Build the prompt that will be sent to the LLM
      const prompt =
        `Create a beautiful Mermaid diagram for: **${topic}**\n\n` +
        `Save it to: \`${finalPath}\`\n\n` +
        "Requirements:\n" +
        "- Choose the most appropriate Mermaid diagram type\n" +
        "- Use clean, readable syntax with meaningful node labels\n" +
        "- Add a %% comment at the top describing the diagram\n" +
        "- Use the mermaid_diagram tool to write the file\n" +
        "- After saving, briefly explain what the diagram shows";

      pi.sendUserMessage(prompt);
    },
  });

  // ── 3. Notify user on load ──────────────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode === "tui") {
      ctx.ui.notify("🧜 Mermaid extension loaded — use /mermaid to create diagrams", "info");
    }
  });
}
