import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";

// Database operations (placeholder - in production use Supabase)
async function checkJobPaymentStatus(jobId: string, userId: string) {
	// TODO: Check payment status in database
	console.log(`Checking payment status for job ${jobId} by user ${userId}`);

	// In production, this would query Supabase:
	// const { data } = await supabase
	//   .from('jobs')
	//   .select('payment_status, pdf_url, s3_key')
	//   .eq('id', jobId)
	//   .eq('user_id', userId)
	//   .single();
	//
	// return data;

	// For now, return mock data
	return {
		payment_status: "paid",
		pdf_url: `https://example.com/download/${jobId}.pdf`,
		s3_key: `jobs/${jobId}/coloring-page.pdf`,
	};
}

async function trackDownload(jobId: string, userId: string) {
	// TODO: Track download in database
	console.log(
		`Tracking download for job ${jobId} by user ${userId} at ${new Date().toISOString()}`,
	);

	// In production, this would insert into Supabase:
	// await supabase
	//   .from('downloads')
	//   .insert({
	//     job_id: jobId,
	//     user_id: userId,
	//     downloaded_at: new Date().toISOString(),
	//     ip_address: request.ip,
	//     user_agent: request.headers.get('user-agent'),
	//   });
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ jobId: string }> },
) {
	try {
		const { user, error: authError } = await getAuthenticatedUser();
		if (authError) return authError;
		const userId = user.id;

		const { jobId } = await params;

		if (!jobId) {
			return NextResponse.json(
				{ error: "Job ID is required" },
				{ status: 400 },
			);
		}

		// Check if user has paid for this job
		const jobData = await checkJobPaymentStatus(jobId, userId);

		if (!jobData) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		if (jobData.payment_status !== "paid") {
			return NextResponse.json(
				{ error: "Payment required to download" },
				{ status: 402 }, // Payment Required
			);
		}

		if (!jobData.pdf_url) {
			return NextResponse.json({ error: "PDF not available" }, { status: 404 });
		}

		// Track download history
		await trackDownload(jobId, userId);

		// In production, this would generate a signed S3 URL
		// const signedUrl = await generateSignedDownloadUrl(jobData.s3_key);

		// For now, return the direct URL
		return NextResponse.json({
			downloadUrl: jobData.pdf_url,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
		});
	} catch (error) {
		console.error("Download error:", error);
		return NextResponse.json(
			{ error: "Failed to generate download link" },
			{ status: 500 },
		);
	}
}
