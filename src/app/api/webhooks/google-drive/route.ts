import { NextRequest, NextResponse } from 'next/server';

// Google Drive webhook verification token
const WEBHOOK_VERIFICATION_TOKEN = process.env.GOOGLE_WEBHOOK_VERIFICATION_TOKEN || '';

/**
 * GET - Verify webhook with Google Drive
 * Google sends a verification challenge when setting up the webhook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get('challenge');
  const token = searchParams.get('verification_token');

  // Verify the token matches
  if (token !== WEBHOOK_VERIFICATION_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid verification token' },
      { status: 403 }
    );
  }

  // Return the challenge to verify the webhook
  return NextResponse.json(
    { challenge },
    { status: 200 }
  );
}

/**
 * POST - Handle Google Drive webhook notifications
 * Called when files are added/modified in the watched folder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = request.headers;

    // Verify webhook signature if configured
    const signature = headers.get('x-goog-channel-id');
    const resourceState = headers.get('x-goog-resource-state');

    // Google sends 'sync' when first setting up the webhook
    if (resourceState === 'sync') {
      console.log('Google Drive webhook sync received');
      return NextResponse.json({ message: 'Sync received' }, { status: 200 });
    }

    // Process file change notifications
    console.log('Google Drive webhook notification:', {
      channelId: headers.get('x-goog-channel-id'),
      resourceId: headers.get('x-goog-resource-id'),
      resourceState,
      changed: body.changed,
    });

    // Extract file IDs from the notification
    const fileIds = body.changed || [];

    if (fileIds.length === 0) {
      return NextResponse.json(
        { message: 'No files to process' },
        { status: 200 }
      );
    }

    // Trigger extraction for each file
    const extractionPromises = fileIds.map(async (fileId: string) => {
      try {
        // Call the extract API with the Google Drive file ID
        const extractResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/extract`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId,
              source: 'google-drive',
            }),
          }
        );

        if (!extractResponse.ok) {
          console.error(`Failed to extract file ${fileId}:`, await extractResponse.text());
        } else {
          console.log(`Successfully extracted file ${fileId}`);
        }
      } catch (error) {
        console.error(`Error processing file ${fileId}:`, error);
      }
    });

    await Promise.allSettled(extractionPromises);

    return NextResponse.json(
      {
        message: 'Webhook processed successfully',
        processedFiles: fileIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing Google Drive webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
