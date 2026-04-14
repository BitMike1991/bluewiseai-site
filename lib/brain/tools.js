// lib/brain/tools.js
// AI SDK 6 tool definitions wrapping extracted runners
// Factory function: createBrainTools(supabase, customerId) => tools object

import { tool } from "ai";
import { z } from "zod";

import { runListLeadsTool, runFindLeadTool, runCreateLeadTool, runUpdateLeadTool } from "./runners/leads";
import { runSummarizeConversationTool, runDraftReplyTool, runSendMessageTool } from "./runners/messages";
import { runGetTasksTool, runCreateTaskTool, runUpdateTaskTool } from "./runners/tasks";
import { runSearchMessagesTool } from "./runners/search";
import { runListJobsTool, runGetJobTool, runCreateJobTool, runUpdateJobTool } from "./runners/jobs";
import { runListAppointmentsTool } from "./runners/calendar";
import { runListCallsTool, runGetCallTranscriptTool } from "./runners/calls";
import { runGetKpisTool, runGetPipelineTool } from "./runners/analytics";

export function createBrainTools(supabase, customerId) {
  return {
    list_leads: tool({
      description:
        "Get CRM leads from the database, enriched with inbox activity stats. Use when the user asks to see their leads, pipeline, or contacts.",
      inputSchema: z.object({
        status: z
          .enum(["open", "new", "active", "quoted", "won", "lost", "all"])
          .optional()
          .describe("Filter by lead status. 'open' excludes closed/dead/lost/won. 'all' returns everything."),
        no_reply_hours: z
          .number()
          .optional()
          .describe("Only show leads with no reply in this many hours"),
        missed_calls_only: z
          .boolean()
          .optional()
          .describe("Only show leads with missed calls"),
        source: z
          .string()
          .optional()
          .describe("Filter by lead source (e.g. 'facebook_lead_ad', 'website', 'referral')"),
        created_after: z
          .string()
          .optional()
          .describe("ISO 8601 datetime — only return leads created after this date. Use for 'last 24h', 'today', 'this week' queries."),
        created_before: z
          .string()
          .optional()
          .describe("ISO 8601 datetime — only return leads created before this date."),
        limit: z
          .number()
          .optional()
          .describe("Max number of leads to return (default: all, max: 100)"),
      }),
      execute: async (args) => runListLeadsTool(supabase, customerId, args),
    }),

    find_lead: tool({
      description:
        "Search for a specific lead by name, email, phone, or free-text query. Use when the user mentions a person by name or asks about a specific contact.",
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe("Free-text search (name, email, phone, or any identifier)"),
        email: z.string().optional().describe("Search by email address"),
        phone: z.string().optional().describe("Search by phone number"),
        name: z.string().optional().describe("Search by lead name"),
        limit: z
          .number()
          .optional()
          .describe("Max results to return (1-10, default 5)"),
      }),
      execute: async (args) => runFindLeadTool(supabase, customerId, args),
    }),

    summarize_conversation: tool({
      description:
        "Summarize the conversation history with a specific lead. Returns sentiment, key details, objections, next steps, and recommended follow-up type.",
      inputSchema: z.object({
        lead_id: z.number().optional().describe("Lead ID to summarize"),
        lead_name: z
          .string()
          .optional()
          .describe("Lead name (used to resolve lead_id if not provided)"),
        email: z
          .string()
          .optional()
          .describe("Lead email (used to resolve lead_id if not provided)"),
        phone: z
          .string()
          .optional()
          .describe("Lead phone (used to resolve lead_id if not provided)"),
        days_back: z
          .number()
          .optional()
          .describe("How many days back to look (default 30, max 365)"),
        limit_messages: z
          .number()
          .optional()
          .describe("Max messages to include (default 60, max 200)"),
        focus: z
          .string()
          .optional()
          .describe("Specific focus for the summary (e.g. 'pricing discussion', 'scheduling')"),
      }),
      execute: async (args) =>
        runSummarizeConversationTool(supabase, customerId, args),
    }),

    draft_reply: tool({
      description:
        "Draft a reply message (SMS or email) for a specific lead. Returns multiple variants to choose from. Does NOT send — use send_message after approval.",
      inputSchema: z.object({
        lead_id: z.number().optional().describe("Lead ID to draft for"),
        lead_name: z
          .string()
          .optional()
          .describe("Lead name (used to resolve lead_id if not provided)"),
        email: z
          .string()
          .optional()
          .describe("Lead email (used to resolve lead_id if not provided)"),
        phone: z
          .string()
          .optional()
          .describe("Lead phone (used to resolve lead_id if not provided)"),
        channel: z
          .enum(["sms", "email"])
          .optional()
          .describe("Channel to draft for. Defaults to email if lead has email, otherwise SMS."),
        purpose: z
          .string()
          .optional()
          .describe("Purpose: confirm_followup, reschedule, ask_more_info, or general"),
        tone: z
          .string()
          .optional()
          .describe("Tone: friendly_pro, formal, casual (default: friendly_pro)"),
        language: z
          .string()
          .optional()
          .describe("Language: en or fr (default: auto-detect from lead)"),
        extra_context: z
          .string()
          .optional()
          .describe("Additional context or instructions for the draft"),
        variants: z
          .number()
          .optional()
          .describe("Number of draft variants to generate (1-3, default 3)"),
      }),
      execute: async (args) =>
        runDraftReplyTool(supabase, customerId, args),
    }),

    get_tasks: tool({
      description:
        "Get tasks/follow-ups from the CRM. Can filter by status or lead.",
      inputSchema: z.object({
        status: z
          .string()
          .optional()
          .describe("Filter by task status: pending, completed, all"),
        lead_id: z
          .number()
          .optional()
          .describe("Filter tasks for a specific lead"),
      }),
      execute: async (args) => runGetTasksTool(supabase, customerId, args),
    }),

    create_task: tool({
      description:
        "Create a new task/follow-up for a lead. Requires approval before execution.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        lead_id: z
          .number()
          .optional()
          .describe("Lead ID to attach the task to"),
        lead_name: z
          .string()
          .optional()
          .describe("Lead name (used to resolve lead_id if not provided)"),
        email: z
          .string()
          .optional()
          .describe("Lead email (used to resolve lead_id if not provided)"),
        phone: z
          .string()
          .optional()
          .describe("Lead phone (used to resolve lead_id if not provided)"),
        followup_type: z
          .string()
          .optional()
          .describe("Task type: call, sms, email, meeting, general"),
        scheduled_for_iso: z
          .string()
          .describe("When the task is due (ISO 8601 datetime)"),
        note: z
          .string()
          .optional()
          .describe("Task description/note"),
      }),
      execute: async (args) => runCreateTaskTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || `Task created.`,
        },
      ],
    }),

    update_task: tool({
      description:
        "Update an existing task — change status, reschedule, or add notes. Requires approval.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        task_id: z
          .number()
          .optional()
          .describe("Task ID to update (if known)"),
        lead_id: z
          .number()
          .optional()
          .describe("Lead ID (finds most recent task for this lead)"),
        lead_name: z
          .string()
          .optional()
          .describe("Lead name (used to resolve lead if task_id not provided)"),
        followup_type: z
          .string()
          .optional()
          .describe("Filter by task type when looking up by lead"),
        new_status: z
          .string()
          .optional()
          .describe("New status: pending, completed, cancelled"),
        new_scheduled_for_iso: z
          .string()
          .optional()
          .describe("New due date (ISO 8601)"),
        note: z
          .string()
          .optional()
          .describe("New description/note for the task"),
      }),
      execute: async (args) => runUpdateTaskTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || `Task updated.`,
        },
      ],
    }),

    search_messages: tool({
      description:
        "Semantic search across all conversation messages and embedded content for this tenant. Use when the user asks to find past conversations, search history, or look up what was discussed about a topic.",
      inputSchema: z.object({
        query: z.string().describe("Natural language search query"),
        lead_id: z
          .number()
          .optional()
          .describe("Narrow search to a specific lead"),
        source_types: z
          .array(z.string())
          .optional()
          .describe("Filter by source type (e.g. ['message', 'note'])"),
        limit: z
          .number()
          .optional()
          .describe("Max results (1-20, default 5)"),
      }),
      execute: async (args) =>
        runSearchMessagesTool(supabase, customerId, args),
    }),

    send_message: tool({
      description:
        "Send an SMS or email to a lead. This is a WRITE operation — the message will actually be sent. Always draft first, then send after user approval.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        lead_id: z.number().describe("Lead ID to send to"),
        channel: z.enum(["sms", "email"]).describe("Channel: sms or email"),
        to: z.string().describe("Recipient address (phone or email)"),
        body: z.string().describe("Message body"),
        subject: z
          .string()
          .optional()
          .describe("Email subject (required for email channel)"),
        language: z
          .string()
          .optional()
          .describe("Message language (en or fr)"),
      }),
      execute: async (args) => runSendMessageTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || `Message sent.`,
        },
      ],
    }),

    // ─── LEADS (write) ───
    create_lead: tool({
      description:
        "Create a new lead in the CRM. Requires approval before execution. Use when the user asks to add a new contact or lead.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        name: z.string().optional().describe("Lead's full name"),
        phone: z.string().optional().describe("Phone number"),
        email: z.string().optional().describe("Email address"),
        source: z
          .string()
          .optional()
          .describe("Lead source (e.g. 'facebook', 'website', 'referral', 'manual')"),
        notes: z.string().optional().describe("Notes about the lead"),
        city: z.string().optional().describe("City/location"),
      }),
      execute: async (args) => runCreateLeadTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || "Lead created.",
        },
      ],
    }),

    update_lead: tool({
      description:
        "Update an existing lead's information. Requires approval. Use when the user wants to change a lead's status, add notes, update contact info, etc.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        lead_id: z.number().describe("Lead ID to update"),
        status: z
          .string()
          .optional()
          .describe("New status: new, contacted, active, quoted, cold, closed, dead, won"),
        notes: z.string().optional().describe("Updated notes"),
        city: z.string().optional().describe("Updated city"),
        name: z.string().optional().describe("Updated name"),
        email: z.string().optional().describe("Updated email"),
        phone: z.string().optional().describe("Updated phone"),
        source: z.string().optional().describe("Updated source"),
      }),
      execute: async (args) => runUpdateLeadTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || "Lead updated.",
        },
      ],
    }),

    // ─── JOBS ───
    list_jobs: tool({
      description:
        "List jobs/projects from the CRM. Can filter by status or lead. Use when the user asks about jobs, projects, quotes, or work orders.",
      inputSchema: z.object({
        status: z
          .string()
          .optional()
          .describe("Filter by job status: quoted, scheduled, signed, paid_in_full, completed, cancelled, or 'all'"),
        lead_id: z
          .number()
          .optional()
          .describe("Filter jobs for a specific lead"),
        limit: z
          .number()
          .optional()
          .describe("Max results (1-100, default 25)"),
      }),
      execute: async (args) => runListJobsTool(supabase, customerId, args),
    }),

    get_job: tool({
      description:
        "Get detailed information about a specific job, including related lead data. Use when the user asks about a specific job or project.",
      inputSchema: z.object({
        job_id: z
          .string()
          .describe("Job ID (text job_id like 'JOB-xxx' or numeric id)"),
      }),
      execute: async (args) => runGetJobTool(supabase, customerId, args),
    }),

    create_job: tool({
      description:
        "Create a new job/project in the CRM. Requires approval. Use when the user wants to create a quote, project, or work order.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        lead_id: z
          .number()
          .optional()
          .describe("Lead ID to link the job to"),
        lead_name: z
          .string()
          .optional()
          .describe("Lead name (to resolve lead_id if not provided)"),
        client_name: z
          .string()
          .optional()
          .describe("Client name (auto-filled from lead if lead_id provided)"),
        project_type: z
          .string()
          .optional()
          .describe("Type of project (e.g. 'renovation', 'chimney sweep', 'installation')"),
        project_description: z
          .string()
          .optional()
          .describe("Detailed description of the project"),
        quote_amount: z
          .number()
          .optional()
          .describe("Quote amount in dollars"),
        scheduled_date: z
          .string()
          .optional()
          .describe("Scheduled date (ISO 8601)"),
        status: z
          .string()
          .optional()
          .describe("Initial status (default: 'quoted'). Options: quoted, scheduled, signed"),
      }),
      execute: async (args) => runCreateJobTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || "Job created.",
        },
      ],
    }),

    update_job: tool({
      description:
        "Update an existing job — change status, add notes, update schedule or quote. Requires approval.",
      // approval handled client-side via [APPROVED] pattern
      inputSchema: z.object({
        job_id: z
          .string()
          .describe("Job ID to update (text job_id or numeric id)"),
        status: z
          .string()
          .optional()
          .describe("New status: quoted, scheduled, signed, completed, cancelled, paid_in_full"),
        notes: z
          .string()
          .optional()
          .describe("Updated notes"),
        scheduled_date: z
          .string()
          .optional()
          .describe("New scheduled date (ISO 8601)"),
        project_description: z
          .string()
          .optional()
          .describe("Updated project description"),
        quote_amount: z
          .number()
          .optional()
          .describe("Updated quote amount in dollars"),
      }),
      execute: async (args) => runUpdateJobTool(supabase, customerId, args),
      experimental_toToolResultContent: (result) => [
        {
          type: "text",
          text: result.aiSummary || "Job updated.",
        },
      ],
    }),

    // ─── CALENDAR (uses jobs with scheduled dates) ───
    list_appointments: tool({
      description:
        "List scheduled appointments/jobs from the calendar. Shows jobs that have a scheduled date. Use when the user asks about their schedule, calendar, or upcoming appointments.",
      inputSchema: z.object({
        date_from: z
          .string()
          .optional()
          .describe("Start date filter (ISO date, e.g. '2026-04-14')"),
        date_to: z
          .string()
          .optional()
          .describe("End date filter (ISO date, e.g. '2026-04-20')"),
      }),
      execute: async (args) => runListAppointmentsTool(supabase, customerId, args),
    }),

    // ─── CALLS ───
    list_calls: tool({
      description:
        "List call records with scores and outcomes. Use when the user asks about call history, call performance, or voice AI activity.",
      inputSchema: z.object({
        date_from: z
          .string()
          .optional()
          .describe("Start date filter (ISO date)"),
        date_to: z
          .string()
          .optional()
          .describe("End date filter (ISO date)"),
        lead_name: z
          .string()
          .optional()
          .describe("Filter by lead name (partial match)"),
        limit: z
          .number()
          .optional()
          .describe("Max results (1-100, default 25)"),
      }),
      execute: async (args) => runListCallsTool(supabase, customerId, args),
    }),

    get_call_transcript: tool({
      description:
        "Get the full transcript and detailed scoring for a specific call. Use when the user wants to review what was said in a call.",
      inputSchema: z.object({
        call_id: z
          .string()
          .describe("The call_id from call_scores to retrieve"),
      }),
      execute: async (args) => runGetCallTranscriptTool(supabase, customerId, args),
    }),

    // ─── ANALYTICS ───
    get_kpis: tool({
      description:
        "Get key performance indicators: lead counts, conversion rates, pipeline value, call stats, and more. Use when the user asks for a dashboard, stats, metrics, or performance overview.",
      inputSchema: z.object({
        period: z
          .string()
          .optional()
          .describe("Time period: 'today', 'week', '7d', 'month', '30d', 'quarter', '90d', 'year', '365d'. Default: all time."),
      }),
      execute: async (args) => runGetKpisTool(supabase, customerId, args),
    }),

    get_pipeline: tool({
      description:
        "Get the lead pipeline — leads grouped by status with counts. Use when the user asks about their pipeline, funnel, or lead distribution.",
      inputSchema: z.object({
        _unused: z.string().optional().describe("No parameters needed"),
      }),
      execute: async () => runGetPipelineTool(supabase, customerId),
    }),
  };
}
