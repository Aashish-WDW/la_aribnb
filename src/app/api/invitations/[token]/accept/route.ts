import { NextResponse } from "next/server";
import { createClientServer, getServiceSupabase } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";

export async function POST(
    req: Request,
    props: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await props.params;
        const supabaseClient = await createClientServer();
        const { data: { user } } = await supabaseClient.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
        }

        const supabase = getServiceSupabase();

        // Find invitation by token
        const { data: invitation, error: inviteError } = await supabase
            .from('Invitation')
            .select(`
                *,
                property:Property(id, name, ownerId)
            `)
            .eq('token', token)
            .single();

        if (inviteError || !invitation) {
            return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 });
        }

        // Check if expired
        if (new Date(invitation.expiresAt) < new Date()) {
            // Update status to expired
            await supabase
                .from('Invitation')
                .update({ status: 'EXPIRED' })
                .eq('id', invitation.id);

            return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
        }

        // Check if already accepted
        if (invitation.status === 'ACCEPTED') {
            return NextResponse.json({ error: "Invitation has already been used" }, { status: 409 });
        }

        // Check if user already has permission for this property
        const { data: existingPermission } = await supabase
            .from('UserPermission')
            .select('id')
            .eq('userId', userId)
            .eq('propertyId', invitation.propertyId)
            .single();

        if (existingPermission) {
            // Update invitation as accepted anyway
            await supabase
                .from('Invitation')
                .update({ status: 'ACCEPTED' })
                .eq('id', invitation.id);

            return NextResponse.json({
                message: "You already have access to this property",
                propertyName: invitation.property.name,
                propertyId: invitation.propertyId
            });
        }

        // Create UserPermission
        const { error: permissionError } = await supabase
            .from('UserPermission')
            .insert({
                userId,
                propertyId: invitation.propertyId,
                role: invitation.role,
            });

        if (permissionError) {
            console.error('Error creating permission:', permissionError);
            throw new Error('Failed to grant access');
        }

        // Update invitation status
        const { error: updateError } = await supabase
            .from('Invitation')
            .update({ status: 'ACCEPTED' })
            .eq('id', invitation.id);

        if (updateError) {
            console.error('Error updating invitation:', updateError);
        }

        // Send success notification to the user
        await sendNotification(
            userId,
            'Invitation Accepted',
            `You now have ${invitation.role} access to ${invitation.property.name}`,
            'success',
            { propertyId: invitation.propertyId }
        );

        // Optionally notify the inviter
        if (invitation.invitedBy) {
            await sendNotification(
                invitation.invitedBy,
                'Invitation Accepted',
                `${user.email} has accepted your invitation to ${invitation.property.name}`,
                'info',
                { propertyId: invitation.propertyId }
            );
        }

        return NextResponse.json({
            message: 'Invitation accepted successfully',
            propertyId: invitation.propertyId,
            propertyName: invitation.property.name,
            role: invitation.role
        });

    } catch (error: any) {
        console.error('Failed to accept invitation:', error);
        return NextResponse.json(
            { error: error.message || "Failed to accept invitation" },
            { status: 500 }
        );
    }
}
