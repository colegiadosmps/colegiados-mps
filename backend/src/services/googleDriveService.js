import crypto from "node:crypto";
import { get, run } from "../database/db.js";
import { importCsvContent } from "./importacaoService.js";
import { parseFileName } from "./fileNameService.js";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const DEFAULT_PUBLICATIONS_SUFFIX = "_Publicacoes";

const getConfig = () => ({
  rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "",
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
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

  const downloadFile = async (fileId) => {
    const url = new URL(`${DRIVE_FILES_ENDPOINT}/${fileId}`);
    url.searchParams.set("alt", "media");
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
    listFiles,
    downloadFile,
  };
};

const upsertPublicationFolder = async ({
  siglaColegiado,
  nomePasta,
  linkPasta,
  dataBase,
}) => {
  const existing = await get(
    `SELECT id
     FROM pastas_publicacoes
     WHERE sigla_colegiado = ? AND nome_pasta = ?`,
    [siglaColegiado, nomePasta],
  );

  if (existing) {
    await run(
      `UPDATE pastas_publicacoes
       SET link_pasta = ?, data_base = ?, ativo = 'Sim', updated_at = datetime('now')
       WHERE id = ?`,
      [linkPasta, dataBase || null, existing.id],
    );
    return "updated";
  }

  await run(
    `INSERT INTO pastas_publicacoes (
      sigla_colegiado,
      nome_pasta,
      link_pasta,
      data_base,
      ativo,
      updated_at
    ) VALUES (?, ?, ?, ?, 'Sim', datetime('now'))`,
    [siglaColegiado, nomePasta, linkPasta, dataBase || null],
  );

  return "created";
};

export const getGoogleDriveStatus = () => {
  const config = getConfig();

  return {
    configured: Boolean(
      config.rootFolderId && config.serviceAccountEmail && config.privateKey,
    ),
    root_folder_id: config.rootFolderId || null,
    publications_suffix: config.publicationsSuffix,
    service_account_email: config.serviceAccountEmail || null,
  };
};

export const syncGoogleDrive = async () => {
  const config = getConfig();
  const drive = await createDriveClient();
  const colegiadoFolders = await drive.listFiles({
    parentId: config.rootFolderId,
    mimeType: "application/vnd.google-apps.folder",
  });

  const summary = {
    folders_scanned: colegiadoFolders.length,
    imported_files: [],
    publication_folders: [],
    skipped_files: [],
    errors: [],
  };

  for (const colegiadoFolder of colegiadoFolders) {
    const siglaColegiado = colegiadoFolder.name.trim().toUpperCase();

    try {
      const folderItems = await drive.listFiles({
        parentId: colegiadoFolder.id,
        fields: "files(id,name,mimeType,webViewLink)",
      });

      const csvFiles = folderItems
        .filter((item) => item.mimeType !== "application/vnd.google-apps.folder")
        .filter((item) => item.name.toLowerCase().endsWith(".csv"));

      const publicationFolders = folderItems.filter(
        (item) =>
          item.mimeType === "application/vnd.google-apps.folder" &&
          item.name === `${siglaColegiado}${config.publicationsSuffix}`,
      );

      const latestByType = new Map();

      for (const csvFile of csvFiles) {
        try {
          const fileInfo = parseFileName(csvFile.name);

          if (fileInfo.siglaColegiado !== siglaColegiado) {
            summary.skipped_files.push({
              file: csvFile.name,
              reason: `Sigla do arquivo (${fileInfo.siglaColegiado}) diferente da pasta (${siglaColegiado}).`,
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
          const content = await drive.downloadFile(csvFile.id);
          const result = await importCsvContent(content, csvFile.name);
          summary.imported_files.push(result);
        } catch (error) {
          summary.errors.push({
            file: csvFile.name,
            message: error.message,
          });
        }
      }

      for (const publicationFolder of publicationFolders) {
        const action = await upsertPublicationFolder({
          siglaColegiado,
          nomePasta: publicationFolder.name,
          linkPasta: publicationFolder.webViewLink || "",
          dataBase: null,
        });

        summary.publication_folders.push({
          sigla_colegiado: siglaColegiado,
          nome_pasta: publicationFolder.name,
          action,
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
