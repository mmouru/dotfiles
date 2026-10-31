/**
 * Quiz Extension
 *
 * Generates interactive multiple-choice quizzes from notes and context.
 * Perfect for building spaced-repetition practice from Obsidian notes,
 * code docs, or any learning material currently in the conversation.
 *
 * Usage:
 *   /quiz                         → wizard: topic, count, output path
 *   /quiz python decorators        → skip topic prompt, go straight to count
 *   /quiz quick 3 questions on X   → short-form one-liner
 *
 * Flow:
 *   1. /quiz sends a crafted prompt to the LLM
 *   2. LLM reads context and calls the generate_quiz tool
 *   3. An interactive TUI quiz launches inline
 *   4. Each answer reveals green ✓ (correct) or red ✗ (wrong) with an explanation
 *   5. Final score screen → Markdown results file saved (Obsidian callout format)
 *
 * Place at: ~/.pi/agent/extensions/quiz.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import {
  Key,
  matchesKey,
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import { Type } from "typebox";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  question: string;
  options: string[]; // exactly 4 choices
  correctIndex: number; // 0-based index into options[]
  explanation: string; // shown after answering
}

interface QuizResult {
  title: string;
  questions: Question[];
  userAnswers: number[]; // -1 = not answered / cancelled
  score: number;
  total: number;
}

type Phase = "answering" | "revealed" | "finished";

// ─── QuizComponent ────────────────────────────────────────────────────────────

class QuizComponent {
  private current = 0;
  private cursor = 0;
  private phase: Phase = "answering";
  private readonly userAnswers: number[];
  private cachedLines?: string[];
  private cachedWidth?: number;

  /** Called when the user finishes or cancels. null = cancelled. */
  public onDone?: (result: QuizResult | null) => void;

  constructor(
    private readonly questions: Question[],
    private readonly title: string,
    private readonly theme: Theme,
    private readonly requestRender: () => void,
  ) {
    this.userAnswers = new Array(questions.length).fill(-1);
  }

  // ── Input handling ───────────────────────────────────────────────────────────

  handleInput(data: string): void {
    if (this.phase === "answering") {
      const maxOpt = this.questions[this.current].options.length - 1;

      if (matchesKey(data, Key.up)) {
        this.cursor = Math.max(0, this.cursor - 1);
        this.invalidate();
        this.requestRender();
      } else if (matchesKey(data, Key.down)) {
        this.cursor = Math.min(maxOpt, this.cursor + 1);
        this.invalidate();
        this.requestRender();
      } else if (matchesKey(data, Key.enter) || matchesKey(data, Key.space)) {
        this.userAnswers[this.current] = this.cursor;
        this.phase = "revealed";
        this.invalidate();
        this.requestRender();
      } else if (matchesKey(data, Key.escape)) {
        // Cancel quiz
        this.onDone?.(null);
      }
    } else if (this.phase === "revealed") {
      if (matchesKey(data, Key.enter) || matchesKey(data, Key.space)) {
        this.advance();
      } else if (matchesKey(data, Key.escape)) {
        this.onDone?.(null);
      }
    } else if (this.phase === "finished") {
      if (
        matchesKey(data, Key.enter) ||
        matchesKey(data, Key.space) ||
        matchesKey(data, Key.escape)
      ) {
        this.onDone?.(this.buildResult());
      }
    }
  }

  private advance(): void {
    if (this.current < this.questions.length - 1) {
      this.current++;
      this.cursor = 0;
      this.phase = "answering";
    } else {
      this.phase = "finished";
    }
    this.invalidate();
    this.requestRender();
  }

  private buildResult(): QuizResult {
    const score = this.questions.reduce(
      (acc, q, i) => acc + (this.userAnswers[i] === q.correctIndex ? 1 : 0),
      0,
    );
    return {
      title: this.title,
      questions: this.questions,
      userAnswers: [...this.userAnswers],
      score,
      total: this.questions.length,
    };
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) return this.cachedLines;

    const th = this.theme;
    const lines: string[] = [];
    // innerWidth: subtract 4 chars (2 left pad + 2 right margin)
    const inner = Math.max(20, width - 4);

    const add = (s = "") => lines.push(truncateToWidth("  " + s, width));
    const blank = () => lines.push("");

    // ── Top border ──
    lines.push(th.fg("borderAccent", "─".repeat(width)));
    blank();

    if (this.phase === "finished") {
      this.renderFinished(lines, width, inner, add, blank, th);
    } else {
      this.renderQuestion(lines, width, inner, add, blank, th);
    }

    blank();
    // ── Bottom border ──
    lines.push(th.fg("borderAccent", "─".repeat(width)));

    this.cachedLines = lines;
    this.cachedWidth = width;
    return lines;
  }

  // ── Question + revealed phases ───────────────────────────────────────────────

  private renderQuestion(
    lines: string[],
    width: number,
    inner: number,
    add: (s?: string) => void,
    blank: () => void,
    th: Theme,
  ): void {
    const q = this.questions[this.current];
    const n = this.questions.length;
    const titleClamped =
      this.title.length > inner - 20
        ? this.title.slice(0, inner - 23) + "…"
        : this.title;

    // ── Header: question number + title ──
    add(
      th.fg("accent", th.bold(`Question ${this.current + 1} of ${n}`)) +
        th.fg("dim", `  ${titleClamped}`),
    );

    // ── Progress dots ──
    const dots = this.questions
      .map((_, i) => {
        if (i === this.current) return th.fg("accent", "◆");
        if (i < this.current) {
          return this.userAnswers[i] === this.questions[i].correctIndex
            ? th.fg("success", "●")
            : th.fg("error", "●");
        }
        return th.fg("dim", "○");
      })
      .join(" ");
    add(dots);
    blank();

    // ── Question text (word-wrapped) ──
    const qWrapped = q.question
      ? wrapTextWithAnsi(q.question, inner)
      : [q.question];
    for (const ql of qWrapped) add(ql);
    blank();

    // ── Answer options ──
    for (let i = 0; i < q.options.length; i++) {
      const label = String.fromCharCode(65 + i); // A B C D
      const opt = q.options[i] ?? "";

      if (this.phase === "answering") {
        const isCursor = i === this.cursor;
        if (isCursor) {
          // Highlighted option: accent colour + selected background
          add(
            th.fg("accent", "▶ ") +
              th.bg("selectedBg", th.fg("accent", ` ${label}. ${opt} `)),
          );
        } else {
          add(th.fg("dim", "  ") + th.fg("muted", `○ ${label}. ${opt}`));
        }
      } else {
        // Revealed: show correct (green) and wrong pick (red)
        const isCorrect = i === q.correctIndex;
        const isUserPick = i === this.userAnswers[this.current];

        if (isCorrect) {
          // Always show correct option in green
          add(th.fg("success", `  ✓  ${label}. ${opt}`));
        } else if (isUserPick) {
          // User's wrong choice in red
          add(th.fg("error", `  ✗  ${label}. ${opt}`));
        } else {
          add(th.fg("dim", `     ${label}. ${opt}`));
        }
      }
    }

    blank();

    // ── Result banner (revealed phase) ──
    if (this.phase === "revealed") {
      const isCorrect = this.userAnswers[this.current] === q.correctIndex;

      if (isCorrect) {
        add(th.fg("success", th.bold("  ✓  Correct!")));
      } else {
        add(th.fg("error", th.bold("  ✗  Incorrect")));
        const cLabel = String.fromCharCode(65 + q.correctIndex);
        add(
          th.fg("dim", "  Correct answer: ") +
            th.fg("success", `${cLabel}. ${q.options[q.correctIndex]}`),
        );
      }

      // Explanation
      if (q.explanation) {
        blank();
        add(th.fg("accent", "💡 ") + th.fg("dim", th.bold("Explanation")));
        const expLines = wrapTextWithAnsi(q.explanation, inner - 2);
        for (const el of expLines) {
          lines.push(truncateToWidth("    " + el, width));
        }
      }

      blank();
      const isLast = this.current === n - 1;
      const hint = isLast
        ? "Enter to see final results  →"
        : "Space or Enter for next question  →";
      add(th.fg("dim", hint));
    } else {
      // Answering phase hint
      add(th.fg("dim", "↑ ↓ navigate  ·  Enter / Space to lock in answer  ·  Esc cancel"));
    }
  }

  // ── Finished / score screen ──────────────────────────────────────────────────

  private renderFinished(
    lines: string[],
    width: number,
    inner: number,
    add: (s?: string) => void,
    blank: () => void,
    th: Theme,
  ): void {
    const score = this.questions.reduce(
      (acc, q, i) => acc + (this.userAnswers[i] === q.correctIndex ? 1 : 0),
      0,
    );
    const total = this.questions.length;
    const pct = Math.round((score / total) * 100);

    const trophy =
      pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "📚" : "💪";
    const scoreColor: "success" | "warning" | "error" =
      pct >= 70 ? "success" : pct >= 50 ? "warning" : "error";

    // ── Headline ──
    add(th.fg("accent", th.bold(`${trophy}  Quiz Complete  —  ${this.title}`)));
    blank();

    // ── Score line ──
    add(th.fg(scoreColor, th.bold(`Score: ${score} / ${total}  (${pct}%)`)));

    // ── Progress bar ──
    const barWidth = Math.min(40, inner - 2);
    const filled = Math.round((score / total) * barWidth);
    add(
      th.fg("success", "█".repeat(filled)) +
        th.fg("dim", "░".repeat(Math.max(0, barWidth - filled))),
    );
    blank();

    // ── Per-question summary ──
    add(th.fg("muted", th.bold("Results:")));
    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      const ua = this.userAnswers[i];
      const skipped = ua === -1;
      const correct = !skipped && ua === q.correctIndex;
      const icon = skipped
        ? th.fg("dim", "—")
        : correct
          ? th.fg("success", "✓")
          : th.fg("error", "✗");

      const maxPreview = inner - 10;
      const preview =
        q.question.length > maxPreview
          ? q.question.slice(0, maxPreview - 3) + "…"
          : q.question;
      add(`  ${icon}  ${th.fg("dim", `${i + 1}.`)} ${th.fg("muted", preview)}`);
    }

    blank();
    add(th.fg("dim", "Enter to close and save results"));
  }

  // ── Cache invalidation ───────────────────────────────────────────────────────

  invalidate(): void {
    this.cachedLines = undefined;
    this.cachedWidth = undefined;
  }
}

// ─── Markdown Report (Obsidian callout format) ────────────────────────────────

function buildMarkdownReport(result: QuizResult): string {
  const { title, questions, userAnswers, score, total } = result;
  const pct = Math.round((score / total) * 100);
  const date = new Date().toISOString().split("T")[0];
  const trophy =
    pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "📚" : "💪";

  let md = `# ${trophy} Quiz: ${title}\n\n`;
  md += `> **Date:** ${date}  \n`;
  md += `> **Score:** ${score} / ${total} (${pct}%)\n\n`;
  md += `---\n\n`;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const ua = userAnswers[i];
    const skipped = ua === -1;
    const correct = !skipped && ua === q.correctIndex;
    const statusIcon = skipped ? "—" : correct ? "✓" : "✗";

    md += `## Question ${i + 1}  ${statusIcon}\n\n`;
    md += `**${q.question}**\n\n`;

    for (let j = 0; j < q.options.length; j++) {
      const label = String.fromCharCode(65 + j);
      const isCorrect = j === q.correctIndex;
      const isUser = j === ua;
      const checkbox = isCorrect ? "- [x]" : "- [ ]";
      const suffix =
        isUser && !isCorrect
          ? "  ← *your answer*"
          : isCorrect
            ? "  ✓"
            : "";
      md += `${checkbox} **${label}.** ${q.options[j]}${suffix}\n`;
    }
    md += "\n";

    // Result callout
    if (!skipped) {
      if (correct) {
        md += `> [!success] Correct! ✓\n>\n`;
      } else {
        md += `> [!failure] Incorrect ✗\n`;
        const uLabel = String.fromCharCode(65 + ua);
        md += `> - You answered: **${uLabel}.** ${q.options[ua]}\n`;
        const cLabel = String.fromCharCode(65 + q.correctIndex);
        md += `> - Correct answer: **${cLabel}.** ${q.options[q.correctIndex]}\n>\n`;
      }
    }

    // Explanation callout
    if (q.explanation) {
      md += `> [!tip] Explanation\n> ${q.explanation}\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

// ─── Prompt guidelines injected when the tool is active ─────────────────────

const PROMPT_GUIDELINES = [
  "Use generate_quiz when the user wants to create a quiz, test knowledge, or practice recall from notes.",
  "generate_quiz: read relevant context files or notes carefully before generating questions.",
  "generate_quiz: write questions that test genuine understanding — not just keyword recall.",
  "generate_quiz: make all four options plausible; distractors should represent common misconceptions.",
  "generate_quiz: correctIndex must point to the single unambiguously correct answer (0=A, 1=B, 2=C, 3=D).",
  "generate_quiz: explanations reinforce learning — explain why the correct answer is right AND why others are wrong.",
  "generate_quiz: vary question formats — definitions, applications, comparisons, cause/effect, examples.",
  "generate_quiz: default to 5 questions unless the user specifies a different count.",
];

// ─── Extension factory ────────────────────────────────────────────────────────

export default function quizExtension(pi: ExtensionAPI) {

  // ── LLM-callable tool ─────────────────────────────────────────────────────────
  pi.registerTool({
    name: "generate_quiz",
    label: "Generate Quiz",
    description:
      "Create and run an interactive multiple-choice quiz inline. " +
      "Call this when the user asks to be quizzed, tested, or wants to practice " +
      "recall from notes, documentation, or any learning material in the context. " +
      "The quiz shows one question at a time; answers reveal green ✓ or red ✗ with explanations.",
    promptSnippet: "Run an interactive multiple-choice quiz from context/notes",
    promptGuidelines: PROMPT_GUIDELINES,

    parameters: Type.Object({
      title: Type.String({
        description:
          "Short descriptive title for this quiz " +
          "(e.g. 'Python Decorators', 'Chapter 3 Review', 'React Hooks')",
      }),
      questions: Type.Array(
        Type.Object({
          question: Type.String({
            description: "The question text. Be precise and unambiguous.",
          }),
          options: Type.Array(Type.String(), {
            minItems: 4,
            maxItems: 4,
            description:
              "Exactly 4 answer options. Do NOT include 'A.' / 'B.' prefixes — " +
              "the quiz UI adds those automatically.",
          }),
          correctIndex: Type.Number({
            description:
              "Zero-based index of the correct option (0=A, 1=B, 2=C, 3=D). " +
              "Must be 0, 1, 2, or 3.",
          }),
          explanation: Type.String({
            description:
              "1–3 sentence explanation shown after answering. " +
              "Explain why the correct answer is right and, if helpful, why the distractors are wrong.",
          }),
        }),
        {
          minItems: 1,
          description:
            "Quiz questions. Recommended 5–10 for a good session. " +
            "Vary difficulty and question type across the set.",
        },
      ),
      outputPath: Type.Optional(
        Type.String({
          description:
            "Where to save the Markdown results file (relative or absolute). " +
            "Defaults to 'quiz-results.md' in the working directory. " +
            "For Obsidian: use a vault-relative path like 'Quizzes/python-decorators.md'.",
        }),
      ),
    }),

    async execute(_toolCallId, params, _signal, onUpdate, ctx) {
      const { title, questions, outputPath = "quiz-results.md" } = params;
      const absPath = resolve(ctx.cwd, outputPath);

      // ── Non-interactive fallback ──────────────────────────────────────────────
      if (ctx.mode !== "tui") {
        const skeleton: QuizResult = {
          title,
          questions: questions as Question[],
          userAnswers: new Array(questions.length).fill(-1),
          score: 0,
          total: questions.length,
        };
        try {
          mkdirSync(dirname(absPath), { recursive: true });
          writeFileSync(absPath, buildMarkdownReport(skeleton), "utf8");
        } catch (_) {
          // best effort
        }
        return {
          content: [
            {
              type: "text",
              text: `Quiz "${title}" has ${questions.length} questions. Run pi in TUI mode to take it interactively.`,
            },
          ],
          details: { title, total: questions.length, outputPath: absPath },
        };
      }

      onUpdate?.({
        content: [
          {
            type: "text",
            text: `Starting quiz: "${title}" — ${questions.length} questions…`,
          },
        ],
      });

      // ── Launch interactive quiz ───────────────────────────────────────────────
      const result = await ctx.ui.custom<QuizResult | null>(
        (tui, theme, _kb, done) => {
          const component = new QuizComponent(
            questions as Question[],
            title,
            theme,
            () => tui.requestRender(),
          );
          component.onDone = (r) => done(r);

          return {
            render: (w) => component.render(w),
            handleInput: (data) => component.handleInput(data),
            invalidate: () => component.invalidate(),
          };
        },
      );

      // Cancelled / escaped
      if (!result) {
        return {
          content: [{ type: "text", text: `Quiz "${title}" was cancelled.` }],
          details: { title, completed: false },
        };
      }

      // ── Save Markdown results ─────────────────────────────────────────────────
      let savedPath: string | null = null;
      try {
        mkdirSync(dirname(absPath), { recursive: true });
        writeFileSync(absPath, buildMarkdownReport(result), "utf8");
        savedPath = absPath;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        ctx.ui.notify(`Could not save results: ${msg}`, "error");
      }

      const pct = Math.round((result.score / result.total) * 100);
      const trophy =
        pct >= 90 ? "🏆" : pct >= 70 ? "🎉" : pct >= 50 ? "📚" : "💪";

      const summary =
        `${trophy} Quiz complete: "${title}"\n` +
        `Score: ${result.score} / ${result.total} (${pct}%)\n` +
        (savedPath ? `\nResults saved to: \`${savedPath}\`` : "");

      return {
        content: [{ type: "text", text: summary }],
        details: {
          title,
          score: result.score,
          total: result.total,
          percentage: pct,
          outputPath: savedPath,
          answers: result.questions.map((q, i) => ({
            question: q.question,
            userAnswer:
              result.userAnswers[i] === -1
                ? "skipped"
                : q.options[result.userAnswers[i]],
            correct: result.userAnswers[i] === q.correctIndex,
            correctAnswer: q.options[q.correctIndex],
          })),
        },
      };
    },
  });

  // ── /quiz slash command ───────────────────────────────────────────────────────
  pi.registerCommand("quiz", {
    description:
      "Generate an interactive quiz from current context or notes. " +
      "Usage: /quiz [topic]",

    getArgumentCompletions: (prefix) => {
      const suggestions = [
        { value: "quick 3 questions on ", label: "quick (3 questions) on …" },
        { value: "5 questions about ",    label: "5 questions about …" },
        { value: "deep dive 10 on ",      label: "deep dive (10 questions) on …" },
        { value: "everything I need to know about ", label: "everything about …" },
      ];
      const filtered = suggestions.filter((s) => s.value.startsWith(prefix));
      return filtered.length > 0 ? filtered : null;
    },

    handler: async (args, ctx) => {
      let topic = args.trim();
      let count = "5";
      let outputPath = "quiz-results.md";

      // ── Gather config via input dialogs ──
      if (ctx.hasUI) {
        if (!topic) {
          topic =
            (await ctx.ui.input(
              "Quiz topic",
              "What should the quiz be about?\n" +
                "(leave empty to quiz on everything currently in context)",
              "",
            )) ?? "";
        }

        count =
          (await ctx.ui.input(
            "Number of questions",
            "How many questions? (recommended: 3–10)",
            "5",
          )) ?? "5";

        outputPath =
          (await ctx.ui.input(
            "Save results to",
            "Markdown file path for quiz results.\n" +
              "Tip: point this at your Obsidian vault for instant review notes.\n" +
              "Example: /home/user/Obsidian/quizzes/topic.md",
            "quiz-results.md",
          )) ?? "quiz-results.md";
      }

      const n = Math.max(1, Math.min(20, parseInt(count, 10) || 5));
      const topicText = topic
        ? `on: **${topic}**`
        : "covering the key concepts from the current context and notes";

      const prompt =
        `Please create a learning quiz ${topicText}.\n\n` +
        `**Requirements:**\n` +
        `- Exactly **${n} questions**, each with 4 options (A–D) and one correct answer\n` +
        `- Questions should test genuine understanding and application — not just definitions\n` +
        `- Distractors must be plausible (represent real misconceptions), not obviously wrong\n` +
        `- Include a 1–3 sentence explanation for each question\n` +
        `- Vary the question types: definitions, examples, comparisons, cause/effect, applications\n` +
        `- Save the results file to: \`${outputPath}\`\n\n` +
        `Call the \`generate_quiz\` tool with your questions to launch the interactive quiz now.`;

      pi.sendUserMessage(prompt);
    },
  });

  // ── Session start notification ────────────────────────────────────────────────
  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode === "tui") {
      ctx.ui.notify(
        "🎓 Quiz extension loaded — /quiz to test your knowledge",
        "info",
      );
    }
  });
}
