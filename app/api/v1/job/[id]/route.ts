import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { getJobStatus } from "@/lib/queue";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		// Verify authentication
		const { user, error: authError } = await getAuthenticatedUser();
		if (authError) return authError;
		const userId = user.id;

		const params = await context.params;
		const { id: jobId } = params;

		if (!jobId || typeof jobId !== "string") {
			return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
		}

		// Get job status
		const jobStatus = await getJobStatus(jobId);

		if (!jobStatus) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		// Note: In production, you'd want to verify the job belongs to the authenticated user
		// This would require storing userId with the job or in a separate database

		return NextResponse.json({
			success: true,
			job: jobStatus,
		});
	} catch (error) {
		console.error("Get job status API error:", error);
		return NextResponse.json(
			{ error: "Something went wrong" },
			{ status: 500 },
		);
	}
}
