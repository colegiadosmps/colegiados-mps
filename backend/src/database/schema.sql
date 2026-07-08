PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS colegiados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sigla TEXT NOT NULL UNIQUE,
  sigla_exibicao TEXT,
  chave_pasta TEXT,
  nome TEXT NOT NULL,
  categoria TEXT,
  tipo TEXT,
  descricao TEXT,
  competencia TEXT,
  sigla_colegiado_pai TEXT,
  unidade TEXT,
  sigla_unidade_pai TEXT,
  ato_criacao TEXT,
  data_instituicao TEXT,
  data_termino TEXT,
  qtd_min_reunioes_anuais TEXT,
  regra_quorum TEXT,
  observacoes TEXT,
  orgao TEXT,
  dispositivo_legal TEXT,
  ativo TEXT DEFAULT 'Sim',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_membro TEXT NOT NULL,
  sigla_colegiado TEXT NOT NULL,
  sigla_colegiado_pai TEXT,
  unidade TEXT,
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
  observacao TEXT,
  data_base TEXT,
  arquivo_origem TEXT,
  criado_em_brasilia TEXT,
  criado_por TEXT,
  atualizado_em_brasilia TEXT,
  atualizado_por TEXT,
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
  link_ata TEXT,
  observacao TEXT,
  data_base TEXT,
  arquivo_origem TEXT,
  criado_em_brasilia TEXT,
  criado_por TEXT,
  atualizado_em_brasilia TEXT,
  atualizado_por TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pastas_publicacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sigla_colegiado TEXT NOT NULL,
  nome_pasta TEXT NOT NULL,
  link_pasta TEXT NOT NULL,
  drive_folder_id TEXT,
  tipo TEXT,
  numero TEXT,
  data_publicacao TEXT,
  ano TEXT,
  assunto TEXT,
  status TEXT DEFAULT 'Ativo',
  observacao TEXT,
  data_base TEXT,
  ativo TEXT DEFAULT 'Sim',
  criado_em_brasilia TEXT,
  criado_por TEXT,
  atualizado_em_brasilia TEXT,
  atualizado_por TEXT,
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

CREATE TABLE IF NOT EXISTS colegiado_hierarquia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pai_sigla TEXT NOT NULL,
  filho_sigla TEXT NOT NULL,
  filho_chave_pasta TEXT,
  tipo_relacao TEXT,
  origem TEXT,
  municipio TEXT,
  uf TEXT,
  estado TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS usuarios_admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  usuario TEXT NOT NULL UNIQUE,
  coordenacao TEXT,
  ramal TEXT,
  perfil TEXT NOT NULL DEFAULT 'ADMIN',
  status TEXT NOT NULL DEFAULT 'Ativo',
  senha_hash TEXT NOT NULL,
  senha_temporaria INTEGER NOT NULL DEFAULT 0,
  ultimo_login_em TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria_acessos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_hora_brasilia TEXT NOT NULL,
  usuario_id TEXT,
  usuario_nome TEXT,
  usuario_email TEXT,
  perfil TEXT,
  evento TEXT NOT NULL,
  origem TEXT,
  status TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria_alteracoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_hora_brasilia TEXT NOT NULL,
  usuario_id TEXT,
  usuario_nome TEXT,
  usuario_email TEXT,
  perfil TEXT,
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  colegiado_pai TEXT,
  colegiado_alvo TEXT,
  tipo_registro TEXT,
  id_registro_afetado TEXT,
  descricao_resumida TEXT,
  dados_anteriores TEXT,
  dados_novos TEXT,
  origem TEXT,
  status TEXT,
  observacao TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expira_em TEXT NOT NULL,
  revogada_em TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ultimo_uso_em TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios_admin(id)
);
