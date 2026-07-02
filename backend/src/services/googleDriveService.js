import crypto from "node:crypto";
import { get, run } from "../database/db.js";
import { importCsvContent, importRootCsvContent } from "./importacaoService.js";
import { parseFileName } from "./fileNameService.js";
import { formatDateTime, normalizeKey } from "../utils/formatters.js";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const DEFAULT_PUBLICATIONS_SUFFIX = "_Publicacoes";
const GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder";
const GOOGLE_SHEETS_MIME = "application/vnd.google-apps.spreadsheet";
const ROOT_CSV_NAMES = ["COLEGIADOS.CSV", "COLEGIADOS_EXTERNOS.CSV"];

const sanitizePrivateKey = (value) =>
  value
    .trim()
    .replace(/^"(.*)"$/s, "$1")
    .replace(/^'(.*)'$/s, "$1")
    .replace(/\\n/g, "\n");

const getConfig = () => ({
  rootFolderId:
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_FOLDER_ID ||
    "",
  serviceAccountEmail:
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || "",
  privateKey: sanitizePrivateKey(
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      process.env.GOOGLE_PRIVATE_KEY ||
      "",
  ),
  publicationsSuffix:
    process.env.GOOGLE_DRIVE_PUBLICATIONS_SUFFIX || DEFAULT_PUBLICATIONS_SUFFIX,
});

const encodeBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const createJwtAssertion = ({ serviceAccountEmail, privateKey }) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: DRIVE_SCOPE,
      aud: TOKEN_ENDPOINT,
      exp: nowInSeconds + 3600,
      iat: nowInSeconds,
    }),
  );

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  const signature = signer.sign(privateKey, "base64url");
  return `${header}.${payload}.${signature}`;
};

const getAccessToken = async () => {
  const config = getConfig();

  if (!config.rootFolderId) {
    throw new Error("Defina GOOGLE_DRIVE_ROOT_FOLDER_ID para sincronizar o Google Drive.");
  }

  if (!config.serviceAccountEmail || !config.privateKey) {
    throw new Error(
      "Defina GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY para acessar o Google Drive.",
    );
  }

  const assertion = createJwtAssertion(config);
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Falha ao autenticar na API do Google Drive.",
    );
  }

  return payload.access_token;
};

const createDriveClient = async () => {
  const accessToken = await getAccessToken();

  const getFile = async (fileId, fields = "id,name,mimeType,webViewLink") => {
    const url = new URL(`${DRIVE_FILES_ENDPOINT}/${fileId}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("supportsAllDrives", "true");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error?.message || "Falha ao consultar pasta/arquivo no Google Drive.",
      );
    }

    return payload;
  };

  const listFiles = async ({
    parentId,
    mimeType,
    fields = "files(id,name,mimeType,webViewLink)",
  }) => {
    const queryParts = [`'${parentId}' in parents`, "trashed = false"];

    if (mimeType) {
      queryParts.push(`mimeType = '${mimeType}'`);
    }

    const url = new URL(DRIVE_FILES_ENDPOINT);
    url.searchParams.set("q", queryParts.join(" and "));
    url.searchParams.set("fields", fields);
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("supportsAllDrives", "true");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error?.message || "Falha ao listar arquivos do Google Drive.",
      );
    }

    return payload.files || [];
  };

  const downloadFile = async ({ fileId, mimeType }) => {
    const url =
      mimeType === GOOGLE_SHEETS_MIME
        ? new URL(`${DRIVE_FILES_ENDPOINT}/${fileId}/export`)
        : new URL(`${DRIVE_FILES_ENDPOINT}/${fileId}`);

    if (mimeType === GOOGLE_SHEETS_MIME) {
      url.searchParams.set("mimeType", "text/csv");
    } else {
      url.searchParams.set("alt", "media");
    }

    url.searchParams.set("supportsAllDrives", "true");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(payload || "Falha ao baixar arquivo do Google Drive.");
    }

    return response.text();
  };

  return {
    getFile,
    listFiles,
    downloadFile,
  };
};

const upsertPublicationFolder = async ({
  siglaColegiado,
  nomePasta,
  linkPasta,
  driveFolderId,
  dataBase,
}) => {
  const now = formatDateTime(new Date());
  const existing = await get(
    `SELECT id
     FROM pastas_publicacoes
     WHERE sigla_colegiado = ? AND nome_pasta = ?`,
    [siglaColegiado, nomePasta],
  );

  if (existing) {
    await run(
      `UPDATE pastas_publicacoes
       SET link_pasta = ?, drive_folder_id = ?, data_base = ?, ativo = 'Sim', updated_at = ?
       WHERE id = ?`,
      [linkPasta, driveFolderId || null, dataBase || null, now, existing.id],
    );
    return "updated";
  }

  await run(
    `INSERT INTO pastas_publicacoes (
      sigla_colegiado,
      nome_pasta,
      link_pasta,
      drive_folder_id,
      data_base,
      ativo,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, 'Sim', ?)`,
    [siglaColegiado, nomePasta, linkPasta, driveFolderId || null, dataBase || null, now],
  );

  return "created";
};

const isSupportedRootCsv = (item) => {
  const fileName = String(item.name || "").trim();
  const normalizedName = fileName.toUpperCase();
  const isKnownRootFile = ROOT_CSV_NAMES.includes(normalizedName);
  const hasCsvExtension = fileName.toLowerCase().endsWith(".csv");
  const mimeType = String(item.mimeType || "").toLowerCase();
  const hasCompatibleMimeType =
    mimeType === "text/csv" ||
    mimeType === GOOGLE_SHEETS_MIME ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "text/plain" ||
    mimeType === "application/octet-stream";

  return isKnownRootFile && (hasCsvExtension || hasCompatibleMimeType);
};

const isCsvCandidate = (item) =>
  item.mimeType === "text/csv" ||
  item.mimeType === GOOGLE_SHEETS_MIME ||
  item.name.toLowerCase().endsWith(".csv");

const findPublicationFolders = (items, folderName, suffix) => {
  const expected = normalizeKey(`${folderName}${suffix}`);
  return items.filter(
    (item) =>
      item.mimeType === GOOGLE_FOLDER_MIME &&
      normalizeKey(item.name) === expected,
  );
};

export const getGoogleDriveStatus = async () => {
  const config = getConfig();
  const baseStatus = {
    configured: Boolean(
      config.rootFolderId && config.serviceAccountEmail && config.privateKey,
    ),
    root_folder_id: config.rootFolderId || null,
    root_folder_name: null,
    root_folder_label: config.rootFolderId ? "Google Drive" : null,
    publications_suffix: config.publicationsSuffix,
    service_account_email: config.serviceAccountEmail || null,
  };

  if (!baseStatus.configured) {
    return baseStatus;
  }

  try {
    const drive = await createDriveClient();
    const rootFolder = await drive.getFile(config.rootFolderId);

    return {
      ...baseStatus,
      root_folder_name: rootFolder.name || null,
      root_folder_label: rootFolder.name
        ? `Google Drive / ${rootFolder.name}`
        : "Google Drive",
    };
  } catch (_error) {
    return baseStatus;
  }
};

export const syncGoogleDrive = async () => {
  const config = getConfig();
  const drive = await createDriveClient();
  const rootFolder = await drive.getFile(config.rootFolderId);
  const rootItems = await drive.listFiles({
    parentId: config.rootFolderId,
    fields: "files(id,name,mimeType,webViewLink)",
  });

  const colegiadoFolders = rootItems.filter(
    (item) => item.mimeType === GOOGLE_FOLDER_MIME,
  );
  const rootCsvFiles = rootItems.filter(
    (item) => item.mimeType !== GOOGLE_FOLDER_MIME && isSupportedRootCsv(item),
  );

  const summary = {
    folders_scanned: colegiadoFolders.length,
    files_found: rootCsvFiles.length,
    root_folder: {
      id: rootFolder.id,
      name: rootFolder.name,
    },
    root_files_found: rootCsvFiles.map((item) => ({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
    })),
    imported_files: [],
    publication_folders: [],
    skipped_files: [],
    errors: [],
    warnings: [],
  };

  for (const csvFile of rootCsvFiles) {
    try {
      const content = await drive.downloadFile({
        fileId: csvFile.id,
        mimeType: csvFile.mimeType,
      });
      const result = await importRootCsvContent(content, csvFile.name);
      summary.imported_files.push({
        ...result,
        drive_file_id: csvFile.id,
        source_mime_type: csvFile.mimeType,
      });

      if (csvFile.mimeType === GOOGLE_SHEETS_MIME) {
        summary.warnings.push({
          file: csvFile.name,
          reason: "Arquivo Google Sheets detectado e exportado como CSV.",
        });
      }
    } catch (error) {
      summary.errors.push({
        file: csvFile.name,
        drive_file_id: csvFile.id,
        message: error.message,
      });
    }
  }

  if (!rootItems.some((item) => /^colegiados\.csv$/i.test(item.name) && isSupportedRootCsv(item))) {
    summary.warnings.push({
      file: "Colegiados.csv",
      reason: "Colegiados.csv nao encontrado.",
    });
  }

  if (
    !rootItems.some(
      (item) => /^colegiados_externos\.csv$/i.test(item.name) && isSupportedRootCsv(item),
    )
  ) {
    summary.warnings.push({
      file: "Colegiados_Externos.csv",
      reason: "Colegiados_Externos.csv nao encontrado.",
    });
  }

  if (colegiadoFolders.length === 0) {
    return {
      message:
        "Nenhuma subpasta de colegiado foi encontrada na pasta raiz configurada do Google Drive.",
      ...summary,
    };
  }

  for (const colegiadoFolder of colegiadoFolders) {
    const folderKey = normalizeKey(colegiadoFolder.name);

    try {
      const folderItems = await drive.listFiles({
        parentId: colegiadoFolder.id,
        fields: "files(id,name,mimeType,webViewLink)",
      });

      const csvFiles = folderItems
        .filter((item) => item.mimeType !== GOOGLE_FOLDER_MIME)
        .filter(isCsvCandidate);
      summary.files_found += csvFiles.length;

      const publicationFolders = findPublicationFolders(
        folderItems,
        colegiadoFolder.name,
        config.publicationsSuffix,
      );
      const latestByType = new Map();

      for (const csvFile of csvFiles) {
        try {
          const fileInfo = parseFileName(csvFile.name);

          if (fileInfo.siglaColegiado !== folderKey) {
            summary.skipped_files.push({
              file: csvFile.name,
              reason: `Sigla do arquivo (${fileInfo.siglaColegiado}) diferente da pasta (${folderKey}).`,
            });
            continue;
          }

          const current = latestByType.get(fileInfo.tipo);
          if (!current || fileInfo.dataBase > current.fileInfo.dataBase) {
            latestByType.set(fileInfo.tipo, { csvFile, fileInfo });
          }
        } catch (_error) {
          summary.skipped_files.push({
            file: csvFile.name,
            reason: "Nome fora do padrao SIGLA_TIPO_DD_MM_AAAA.csv.",
          });
        }
      }

      for (const [, { csvFile }] of latestByType) {
        try {
          const content = await drive.downloadFile({
            fileId: csvFile.id,
            mimeType: csvFile.mimeType,
          });
          const result = await importCsvContent(content, csvFile.name);
          summary.imported_files.push({
            ...result,
            drive_file_id: csvFile.id,
            source_mime_type: csvFile.mimeType,
          });

          if (csvFile.mimeType === GOOGLE_SHEETS_MIME) {
            summary.warnings.push({
              file: csvFile.name,
              reason: "Arquivo Google Sheets detectado e exportado como CSV.",
            });
          }
        } catch (error) {
          summary.errors.push({
            file: csvFile.name,
            drive_file_id: csvFile.id,
            message: error.message,
          });
        }
      }

      for (const publicationFolder of publicationFolders) {
        const action = await upsertPublicationFolder({
          siglaColegiado: folderKey,
          nomePasta: publicationFolder.name,
          linkPasta: publicationFolder.webViewLink || "",
          driveFolderId: publicationFolder.id,
          dataBase: null,
        });

        summary.publication_folders.push({
          sigla_colegiado: folderKey,
          nome_pasta: publicationFolder.name,
          drive_folder_id: publicationFolder.id,
          action,
        });
      }

      if (!publicationFolders.length) {
        summary.warnings.push({
          file: colegiadoFolder.name,
          reason: `Pasta de publicacoes nao encontrada para ${colegiadoFolder.name}.`,
        });
      }
    } catch (error) {
      summary.errors.push({
        folder: colegiadoFolder.name,
        message: error.message,
      });
    }
  }

  return {
    message: "Sincronizacao com Google Drive concluida.",
    ...summary,
  };
};
