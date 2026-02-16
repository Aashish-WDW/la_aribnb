import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

// GET - List all invitations for user's properties
export async function GET() {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        // Get all properties owned by this user
        const { data: properties, error: propError } = await supabase
            .from('Property')
            .select('id')
            .eq('ownerId', userId);

        if (propError) throw propError;

        const propertyIds = properties.map(p => p.id);

        if (propertyIds.length === 0) {
            return NextResponse.json([]);
        }

        // Get all invitations for these properties
        const { data: invitations, error } = await supabase
            .from('Invitation')
            .select(`
                *,
                property:Property(id, name)
            `)
            .in('propertyId', propertyIds)
            .order('createdAt', { ascending: false });

        if (error) throw error;

        return NextResponse.json(invitations || []);
    } catch (error) {
        console.error("Failed to fetch invitations:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}

// POST - Create and send a new invitation
export async function POST(req: Request) {
    const supabaseClient = await createClientServer();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const supabase = getServiceSupabase();

    try {
        const body = await req.json();
        const { email, role, propertyId } = body;

        // Validate required fields
        if (!email || !role || !propertyId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify user owns this property
        const { data: property, error: propError } = await supabase
            .from('Property')
            .select('id, name')
            .eq('id', propertyId)
            .eq('ownerId', userId)
            .single();

        if (propError || !property) {
            return new NextResponse("Property not found or unauthorized", { status: 404 });
        }

        // Check if invitation already exists for this email + property
        const { data: existing } = await supabase
            .from('Invitation')
            .select('id, status')
            .eq('email', email)
            .eq('propertyId', propertyId)
            .single();

        if (existing && existing.status === 'PENDING') {
            return new NextResponse("Invitation already sent to this email for this property", { status: 409 });
        }

        // Generate unique token
        const token = randomBytes(32).toString('hex');

        // Set expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const { data: invitation, error: createError } = await supabase
            .from('Invitation')
            .insert({
                email,
                role,
                propertyId,
                invitedBy: userId,
                token,
                status: 'PENDING',
                expiresAt: expiresAt.toISOString()
            })
            .select()
            .single();

        if (createError) throw createError;

        // TODO: Send email with invitation link
        // For now, we'll just log the invitation URL
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/${token}`;
        console.log(`Invitation URL for ${email}: ${invitationUrl}`);

        // In production, you would send an email here using a service like:
        // - Resend
        // - SendGrid
        // - AWS SES
        // Example:
        // await sendInvitationEmail({
        //     to: email,
        //     propertyName: property.name,
        //     role,
        //     invitationUrl
        // });

        return NextResponse.json({
            ...invitation,
            invitationUrl // Include URL in response for testing
        });
    } catch (error) {
        console.error("Failed to create invitation:", error);
        return new NextResponse("Database Error", { status: 500 });
    }
}
