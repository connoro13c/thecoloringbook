import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { z } from "zod";
import { createCheckoutSession, PRODUCTS } from "@/lib/stripe";

// Request validation schema
const CheckoutSessionSchema = z.object({
	jobId: z.string().uuid(),
	productType: z.enum(["COLORING_PAGE", "REGENERATE"]),
});

export async function POST(request: NextRequest) {
	try {
		// Verify authentication
		const { user, error: authError } = await getAuthenticatedUser();
		if (authError) return authError;
		const userId = user.id;

		// Parse and validate request body
		const body = await request.json();
		const validation = CheckoutSessionSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "Invalid request data", details: validation.error.errors },
				{ status: 400 },
			);
		}

		const { jobId, productType } = validation.data;

		// Get the request URL for constructing return URLs
		const url = new URL(request.url);
		const baseUrl = `${url.protocol}//${url.host}`;

		const successUrl = `${baseUrl}/upload?session_id={CHECKOUT_SESSION_ID}&job_id=${jobId}`;
		const cancelUrl = `${baseUrl}/upload?canceled=true&job_id=${jobId}`;

		// Create Stripe checkout session
		const session = await createCheckoutSession({
			jobId,
			userId,
			productType,
			successUrl,
			cancelUrl,
		});

		return NextResponse.json({
			success: true,
			sessionId: session.id,
			url: session.url,
			amount: PRODUCTS[productType].price,
		});
	} catch (error) {
		console.error("Checkout API error:", error);
		return NextResponse.json(
			{ error: "Something went wrong" },
			{ status: 500 },
		);
	}
}
