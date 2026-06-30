PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS colegiados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sigla TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT,
  descricao TEXT,
  competencia TEXT,
  ativo TEXT DEFAULT 'Sim',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_membro TEXT NOT NULL,
  sigla_colegiado TEXT NOT NULL,
  sigla_colegiado_pai TEXT,
  matricula TEXT,
  email_institucional TEXT,
  telefone_institucional TEXT,
  telefone_pessoal TEXT,
  tipo_vinculo TEXT,
  papel TEXT,
  detalhamento_papel TEXT,
  inicio_vigencia TEXT,
  fim_vigencia TEXT,
  ativo TEXT,
  data_base TEXT,
  arquivo_origem TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reunioes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_reuniao TEXT,
  id_colegiado TEXT,
  sigla_colegiado TEXT NOT NULL,
  id_unidade TEXT,
  data_reuniao TEXT,
  hora TEXT,
  local TEXT,
  classificacao_pauta TEXT,
  descricao_pauta TEXT,
  texto_ata TEXT,
  status_reuniao TEXT,
  quorum_registrado TEXT,
  data_base TEXT,
  arquivo_origem TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pastas_publicacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sigla_colegiado TEXT NOT NULL,
  nome_pasta TEXT NOT NULL,
  link_pasta TEXT NOT NULL,
  drive_folder_id TEXT,
  data_base TEXT,
  ativo TEXT DEFAULT 'Sim',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS importacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arquivo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  sigla_colegiado TEXT NOT NULL,
  data_base TEXT,
  data_importacao TEXT NOT NULL,
  quantidade_registros INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sincronizacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_sincronizacao TEXT NOT NULL,
  total_pastas_encontradas INTEGER DEFAULT 0,
  total_arquivos_encontrados INTEGER DEFAULT 0,
  total_arquivos_processados INTEGER DEFAULT 0,
  total_registros_membros INTEGER DEFAULT 0,
  total_registros_reunioes INTEGER DEFAULT 0,
  total_pastas_publicacoes INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sincronizacao_arquivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sincronizacao_id INTEGER NOT NULL,
  arquivo TEXT NOT NULL,
  drive_file_id TEXT,
  tipo TEXT NOT NULL,
  sigla_colegiado TEXT NOT NULL,
  data_base TEXT,
  quantidade_registros INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sincronizacao_id) REFERENCES sincronizacoes(id)
);
