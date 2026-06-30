import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const defaultDatabasePath = "./src/database/colegiados.sqlite";
const configuredPath = process.env.DATABASE_PATH || defaultDatabasePath;
const resolvedDefaultDatabasePath = path.resolve(process.cwd(), defaultDatabasePath);

const resolveDatabasePath = () => {
  const candidatePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);

  try {
    fs.mkdirSync(path.dirname(candidatePath), { recursive: true });
    return candidatePath;
  } catch (error) {
    if (candidatePath === resolvedDefaultDatabasePath) {
      throw error;
    }

    console.warn(
      [
        `DATABASE_PATH="${configuredPath}" nao esta gravavel.`,
        `Usando fallback local em "${resolvedDefaultDatabasePath}".`,
        "No Render, monte um Persistent Disk em /data para persistencia real.",
      ].join(" "),
    );

    fs.mkdirSync(path.dirname(resolvedDefaultDatabasePath), { recursive: true });
    return resolvedDefaultDatabasePath;
  }
};

const databasePath = resolveDatabasePath();

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(databasePath);

export const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });

export const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });

export const exec = (sql) =>
  new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

export const getDatabasePath = () => databasePath;

export default db;
