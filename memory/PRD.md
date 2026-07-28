# Método Experiência 15 RP — Planejador de Festa de 15 Anos

## Original Problem Statement
App single-page em React para gestão completa da festa de 15 anos de Ana Clara (tema Jardim Encantado, Setembro 2026, Buffet Castelo). Duas visões (Pro e Família), com Checklist, Fornecedores, Convidados e Orçamento. Dados reais fornecidos pelo usuário.

## Architecture
- Frontend only (React 19 + CRA/Craco), sem backend
- Persistência: localStorage (`ac_check`, `ac_forn`, `ac_conv`)
- Estilo: inline styles com paleta customizada (rosa/verde/dourado/azul + escuro)
- Fonte: Palatino Linotype (serif itálica)

## User Personas
- **Pro (planejador/assessoria)**: edita checklist, fornecedores, convidados, orçamento detalhado
- **Família (Ana Clara e família)**: visão de tranquilidade — vê progresso, equipe contratada, resumo financeiro

## Core Requirements
- Checklist de 6 fases (Imersão, Planejamento, Financeiro, Fornecedores, Convidados, Design) com 38 itens
- 12 fornecedores (7 contratados + 5 pendentes)
- 95 convidados com mesa (1-17) e RSVP
- 15 categorias de orçamento com estimado/previsto/realizado (R$ 65.000 total)
- Toggle Pro/Família com abas contextuais

## Implemented (2026-02)
- App.js completo com todos os dados reais e visualizações Pro + Família
- Persistência localStorage automática
- Filtros e busca de convidados
- Expansão/colapso de fases, fornecedores e categorias de orçamento
- data-testid em todos os elementos interativos

## Backlog (P1)
- Adicionar/remover convidados e fornecedores dinamicamente
- Exportar orçamento em PDF
- Sincronização entre dispositivos (backend + auth)
- Envio de RSVP por link público
