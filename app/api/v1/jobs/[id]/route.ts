import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { user, error: authError } = await getAuthenticatedUser();
		if (authError) return authError;
		const userId = user.id;

		const resolvedParams = await params;
		const { data: job, error } = await supabase
			.from("jobs")
			.select("*")
			.eq("id", resolvedParams.id)
			.eq("user_id", userId)
			.single();

		if (error || !job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		return NextResponse.json({
			id: job.id,
			prompt: job.prompt,
			style: job.style,
			difficulty: job.difficulty,
			status: job.status,
			inputUrl: job.input_url,
			outputUrl: job.output_url,
			pdfUrl: job.pdf_url,
			errorMessage: job.error_message,
			processingTimeMs: job.processing_time_ms,
			createdAt: job.created_at,
			updatedAt: job.updated_at,
		});
	} catch (error) {
		console.error("Get job API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
