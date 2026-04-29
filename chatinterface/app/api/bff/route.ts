import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_URL =
	process.env.BACKEND_URL ||
	(process.env.NODE_ENV === "production"
		? "https://app.turbochat.live"
		: "http://127.0.0.1:8000");

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
const MAX_ACTIONS = 10;
const REQUEST_TIMEOUT_MS = 15_000;

type ActionType =
	| "user.me"
	| "chatbots.list"
	| "stats.get"
	| "analytics.get"
	| "chatbot.share.get"
	| "chatbot.conversation.get";

type JsonObject = Record<string, unknown>;

type BffAction = {
	id?: string;
	type: ActionType;
	payload?: JsonObject;
};

type BffRequest = {
	actions: BffAction[];
};

type BffActionResult = {
	id: string;
	type: ActionType;
	ok: boolean;
	status: number;
	data?: unknown;
	error?: string;
};

function makeActionId(action: BffAction, idx: number): string {
	if (action.id && action.id.trim()) return action.id.trim();
	return `${action.type}#${idx + 1}`;
}

function buildError(message: string, status = 400): { status: number; message: string } {
	return { status, message };
}

async function buildBackendHeaders(request: NextRequest): Promise<Headers> {
	const headers = new Headers();
	headers.set("Accept", "application/json");
	headers.set("Content-Type", "application/json");

	const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });
	const userId =
		(token?.sub as string | undefined) ||
		((token as { id?: string } | null)?.id as string | undefined);
	const userEmail =
		(token?.email as string | undefined) ||
		((token as { user?: { email?: string } } | null)?.user?.email as string | undefined);

	if (userId && userEmail) {
		const backendToken = jwt.sign(
			{ sub: userId, email: userEmail },
			NEXTAUTH_SECRET,
			{ algorithm: "HS256", expiresIn: "1h" }
		);
		headers.set("Authorization", `Bearer ${backendToken}`);
	}

	return headers;
}

async function callBackend(
	request: NextRequest,
	path: string,
	method: "GET" | "POST" = "GET",
	body?: JsonObject
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const headers = await buildBackendHeaders(request);
		const targetUrl = `${BACKEND_URL}${path}`;
		const res = await fetch(targetUrl, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal,
			cache: "no-store",
		});

		const contentType = res.headers.get("content-type") || "";
		let data: unknown = null;
		if (contentType.includes("application/json")) {
			data = await res.json();
		} else {
			data = await res.text();
		}

		if (!res.ok) {
			const message =
				typeof data === "object" && data && "detail" in (data as JsonObject)
					? String((data as JsonObject).detail)
					: `Backend request failed (${res.status})`;

			return { ok: false, status: res.status, error: message, data };
		}

		return { ok: true, status: res.status, data };
	} catch (error) {
		const isAbort = error instanceof Error && error.name === "AbortError";
		return {
			ok: false,
			status: isAbort ? 504 : 502,
			error: isAbort ? "Upstream timeout" : "Backend connection failed",
		};
	} finally {
		clearTimeout(timeout);
	}
}

async function dispatchAction(request: NextRequest, action: BffAction): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
	switch (action.type) {
		case "user.me":
			return callBackend(request, "/api/users/me");
		case "chatbots.list":
			return callBackend(request, "/api/chatbots");
		case "stats.get":
			return callBackend(request, "/api/stats");
		case "analytics.get":
			return callBackend(request, "/api/analytics");
		case "chatbot.share.get": {
			const chatbotId = String(action.payload?.chatbotId || "").trim();
			if (!chatbotId) {
				const err = buildError("payload.chatbotId is required", 400);
				return { ok: false, status: err.status, error: err.message };
			}
			return callBackend(request, `/api/chatbots/${encodeURIComponent(chatbotId)}/share`);
		}
		case "chatbot.conversation.get": {
			const chatbotId = String(action.payload?.chatbotId || "").trim();
			if (!chatbotId) {
				const err = buildError("payload.chatbotId is required", 400);
				return { ok: false, status: err.status, error: err.message };
			}

			const sessionId = String(action.payload?.sessionId || "default").trim() || "default";
			const query = new URLSearchParams({ sessionId });
			return callBackend(
				request,
				`/api/chatbots/${encodeURIComponent(chatbotId)}/conversation?${query.toString()}`
			);
		}
		default:
			return { ok: false, status: 400, error: `Unsupported action type: ${action.type}` };
	}
}

export async function POST(request: NextRequest) {
	let body: BffRequest;

	try {
		body = (await request.json()) as BffRequest;
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!body?.actions || !Array.isArray(body.actions)) {
		return NextResponse.json({ error: "actions must be an array" }, { status: 400 });
	}

	if (body.actions.length === 0) {
		return NextResponse.json({ error: "actions cannot be empty" }, { status: 400 });
	}

	if (body.actions.length > MAX_ACTIONS) {
		return NextResponse.json(
			{ error: `Too many actions. Max allowed is ${MAX_ACTIONS}` },
			{ status: 400 }
		);
	}

	const results = await Promise.all(
		body.actions.map(async (action, idx): Promise<BffActionResult> => {
			const id = makeActionId(action, idx);
			const response = await dispatchAction(request, action);

			return {
				id,
				type: action.type,
				ok: response.ok,
				status: response.status,
				data: response.data,
				error: response.error,
			};
		})
	);

	const successCount = results.filter((result) => result.ok).length;
	const failureCount = results.length - successCount;

	return NextResponse.json(
		{
			results,
			meta: {
				requested: results.length,
				succeeded: successCount,
				failed: failureCount,
			},
		},
		{
			status: 200,
			headers: {
				"Cache-Control": "no-store",
			},
		}
	);
}

export async function GET() {
	return NextResponse.json(
		{
			message: "Use POST /api/bff with { actions: [...] }",
			supportedActions: [
				"user.me",
				"chatbots.list",
				"stats.get",
				"analytics.get",
				"chatbot.share.get",
				"chatbot.conversation.get",
			],
		},
		{ status: 200 }
	);
}
