import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const defaultDatabasePath = "./src/database/colegiados.sqlite";
const configuredPath = process.env.DATABASE_PATH || defaultDatabasePath;
const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

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
