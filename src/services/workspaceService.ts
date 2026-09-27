// Google Workspace Integration (Google Drive & Google Calendar)
// Uses client-side OAuth Bearer token with mandatory explicit user confirmation

import { getAccessToken } from '../firebaseConfig';

export interface DriveExportResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webViewLink?: string;
  error?: string;
}

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}

/**
 * Upload a Price Comparison or Budget Summary to the user's Google Drive
 * Requires prior user confirmation
 */
export async function savePriceComparisonToDrive(
  title: string,
  content: string
): Promise<DriveExportResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to export to Google Drive.');
  }

  try {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: `${title}.txt`,
      mimeType: 'text/plain',
      description: 'Exported price comparison report from Bei Gani? (Kenya Price Aggregator)'
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
      content +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Google Drive upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      fileId: data.id,
      fileName: data.name,
      webViewLink: data.webViewLink
    };
  } catch (error: any) {
    console.error('Google Drive export error:', error);
    return {
      success: false,
      error: error.message || 'Failed to export to Google Drive'
    };
  }
}

/**
 * Add a price tracking, rent due date, or shopping trip reminder to Google Calendar
 * Requires prior user confirmation
 */
export async function scheduleCalendarEvent(
  title: string,
  description: string,
  startDateISO: string,
  endDateISO?: string
): Promise<CalendarEventResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to add events to Google Calendar.');
  }

  try {
    const start = new Date(startDateISO);
    let end: Date;
    if (endDateISO) {
      end = new Date(endDateISO);
    } else {
      // Default to 1 hour duration
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    const eventPayload = {
      summary: title,
      description: `${description}\n\nAdded via Bei Gani? (Kenya's Real-time Price Aggregator)`,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Africa/Nairobi'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Africa/Nairobi'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 * 24 }, // 1 day before
          { method: 'popup', minutes: 60 }       // 1 hour before
        ]
      }
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Google Calendar event failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink
    };
  } catch (error: any) {
    console.error('Google Calendar error:', error);
    return {
      success: false,
      error: error.message || 'Failed to schedule event in Google Calendar'
    };
  }
}
