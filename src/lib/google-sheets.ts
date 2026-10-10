import { google } from "googleapis";
import { db } from "./db";
import { SmmClient } from "./smm-client";

async function getSheetsClient() {
  const credentialsSetting = await db.appSetting.findUnique({
    where: { key: "GOOGLE_SHEETS_CREDENTIALS" },
  });

  const rawJson = credentialsSetting?.value || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawJson) return null;

  try {
    const credentials = JSON.parse(rawJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
  } catch (err) {
    console.error("[GOOGLE SHEETS AUTH ERROR]", err);
    return null;
  }
}

async function getSpreadsheetConfig() {
  const sheetIdSetting = await db.appSetting.findUnique({
    where: { key: "GOOGLE_SPREADSHEET_ID" },
  });
  const sheetNameSetting = await db.appSetting.findUnique({
    where: { key: "GOOGLE_SHEET_TAB_NAME" },
  });

  return {
    spreadsheetId: sheetIdSetting?.value || process.env.GOOGLE_SPREADSHEET_ID || "",
    tabName: sheetNameSetting?.value || "Orders",
  };
}

/**
 * Polls Google Sheet for new orders (rows where Column F "Status" is blank)
 */
export async function pollGoogleSheetForNewOrders() {
  const sheets = await getSheetsClient();
  const { spreadsheetId, tabName } = await getSpreadsheetConfig();
  if (!sheets || !spreadsheetId) return;

  try {
    const range = `${tabName}!A2:J500`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 2; // 1-indexed, starting after header
      const row = rows[i];

      const clientName = (row[1] || "").trim();
      const serviceIdentifier = (row[2] || "").trim();
      const link = (row[3] || "").trim();
      const quantity = parseInt(row[4] || "0", 10);
      const status = (row[5] || "").trim();

      // Only process unhandled rows with a valid link and quantity
      if (!status && link && quantity > 0 && serviceIdentifier) {
        // Find matching service
        const service = await db.service.findFirst({
          where: {
            OR: [
              { id: serviceIdentifier },
              { name: { contains: serviceIdentifier } },
            ],
          },
          include: {
            mapping: {
              include: {
                primaryProvider: true,
              },
            },
          },
        });

        if (!service || !service.mapping) {
          // Write error note to sheet
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!F${rowIndex}:J${rowIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [["FAILED", "", "", "", `Service "${serviceIdentifier}" not found or unmapped`]],
            },
          });
          continue;
        }

        // Link client if exists or create
        let clientId: string | undefined;
        if (clientName) {
          const client = await db.client.upsert({
            where: { name: clientName },
            update: {},
            create: { name: clientName },
          });
          clientId = client.id;
        }

        // Dispatch order to primary provider
        try {
          const clientApi = new SmmClient(
            service.mapping.primaryProvider.apiUrl,
            service.mapping.primaryProvider.apiKey
          );

          const result = await clientApi.addOrder({
            service: service.mapping.primaryServiceId,
            link,
            quantity,
          });

          // Save to local database
          const newOrder = await db.order.create({
            data: {
              clientId,
              serviceId: service.id,
              link,
              quantity,
              currentProviderId: service.mapping.primaryProvider.id,
              providerOrderId: result.order,
              status: "PROCESSING",
              source: "GOOGLE_SHEETS",
              sheetRowIndex: rowIndex,
            },
          });

          // Write back Order ID and Status to Google Sheet
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!F${rowIndex}:G${rowIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [["PROCESSING", result.order]],
            },
          });

          console.log(`[SHEETS SYNC] Successfully placed order for row ${rowIndex}: #${newOrder.id}`);
        } catch (dispatchErr: any) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!F${rowIndex}:J${rowIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [["FAILED", "", "", "", dispatchErr.message || "Dispatch error"]],
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("[SHEETS SYNC ERROR]", err);
  }
}

/**
 * Writes updated order status and counts back to Google Sheet
 */
export async function updateSheetOrderRow(
  rowIndex: number,
  status: string,
  startCount: number | null,
  remains: number | null
) {
  const sheets = await getSheetsClient();
  const { spreadsheetId, tabName } = await getSpreadsheetConfig();
  if (!sheets || !spreadsheetId || !rowIndex) return;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!F${rowIndex}:I${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          status,
          undefined, // keep order ID intact
          startCount !== null ? startCount : "",
          remains !== null ? remains : "",
        ]],
      },
    });
  } catch (err) {
    console.error(`[SHEETS UPDATE ERROR for row ${rowIndex}]`, err);
  }
}
